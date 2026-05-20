import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers, usageLogs } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import axios from 'axios';
import { moderateMessages, buildRejectionResponse } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

// In-memory RPM tracking (per instance)
const rpmMap = new Map<string, number[]>();

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { 
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const tunelleKey = authHeader.split(' ')[1].trim();
  
  // Find provider by Tunelle Key
  const p = await db.select().from(providers).where(eq(providers.tunelleKey, tunelleKey)).limit(1);

  if (p.length === 0) {
    return NextResponse.json({ error: 'Invalid Tunelle Key' }, { 
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const provider = p[0];
  if (!provider.enabled) {
    return NextResponse.json({ error: 'Provider is disabled' }, { 
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // 1. RPM Check
  const now = Date.now();
  const minuteAgo = now - 60000;
  let requests = rpmMap.get(provider.id) || [];
  requests = requests.filter(t => t > minuteAgo);
  if (requests.length >= (provider.rpm || 60)) {
    return NextResponse.json({ error: 'Rate limit exceeded (Requests Per Minute)' }, { 
      status: 429,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  requests.push(now);
  rpmMap.set(provider.id, requests);

  // 2. RPD Check (Persistent)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rpdCountResult = await db.select({ count: sql<number>`cast(count(*) as int)` })
    .from(usageLogs)
    .where(and(
      eq(usageLogs.providerId, provider.id), 
      gte(usageLogs.createdAt, today)
    ));
  
  const currentRpd = rpdCountResult[0]?.count || 0;
  if (currentRpd >= (provider.rpd || 10000)) {
    return NextResponse.json({ error: 'Rate limit exceeded (Requests Per Day)' }, { 
      status: 429,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // 3. Proxy the request
  const body = await req.json();
  const isStreaming = body.stream === true;

  // ── CSAM Moderation ──────────────────────────────────────────────────────
  // Check every user/system message before it reaches any upstream provider.
  // Only CSAM-related flags cause a rejection; adult NSFW is not blocked.
  const moderationKey = process.env.OPENAI_MODERATION_KEY ?? process.env.OPENAI_API_KEY ?? '';
  if (moderationKey) {
    try {
      const mod = await moderateMessages(body.messages ?? [], moderationKey);
      if (mod.blocked) {
        console.warn(`[MODERATION] CSAM block — provider: ${provider.name}, reason: ${mod.reason}`);
        return buildRejectionResponse(mod.reason);
      }
    } catch (err: any) {
      // Fail-closed: if moderation itself errors, reject the request rather
      // than letting potentially illegal content through.
      console.error('[MODERATION] Check failed, rejecting request:', err.message);
      return buildRejectionResponse();
    }
  } else {
    console.warn('[MODERATION] No OPENAI_MODERATION_KEY set — CSAM moderation is disabled!');
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const upstreamUrl = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const authVal = provider.apiKey.startsWith('Bearer ') ? provider.apiKey : `Bearer ${provider.apiKey}`;
    
    const headers = {
      'Authorization': authVal,
      'X-API-Key': provider.apiKey,
      'api-key': provider.apiKey,
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': isStreaming ? 'text/event-stream, application/json' : 'application/json',
    };

    if (isStreaming) {
      const response = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(errText, { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        });
      }

      // Log usage
      await db.insert(usageLogs).values({
        providerId: provider.id,
        modelId: body.model,
      });

      return new Response(response.body, {
        headers: { 
          'Content-Type': 'text/event-stream',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } else {
      const response = await axios.post(upstreamUrl, body, {
        headers,
        timeout: 60000,
      });

      // Log usage
      await db.insert(usageLogs).values({
        providerId: provider.id,
        modelId: body.model,
        promptTokens: response.data.usage?.prompt_tokens,
        completionTokens: response.data.usage?.completion_tokens,
        totalTokens: response.data.usage?.total_tokens,
      });

      return NextResponse.json(response.data, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  } catch (error: any) {
    console.error(`Proxy Error (${provider.name}):`, error.response?.data || error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: { message: error.message } };
    return NextResponse.json(data, { 
      status,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
