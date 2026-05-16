import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const p = await db.select().from(providers);
  return NextResponse.json(p);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, baseUrl, apiKey, enabled, action, rpm, rpd } = body;

  try {
    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
      await db.delete(providers).where(eq(providers.id, id));
      return NextResponse.json({ success: true });
    }

    if (id) {
      // Update
      await db.update(providers).set({
        name,
        baseUrl,
        apiKey,
        rpm: rpm !== undefined ? Number(rpm) : undefined,
        rpd: rpd !== undefined ? Number(rpd) : undefined,
        enabled: enabled !== undefined ? enabled : true,
      }).where(eq(providers.id, id));
    } else {
      // Create
      const tunelleKey = `sk-tunelle-${uuidv4().replace(/-/g, '')}`;
      await db.insert(providers).values({
        name,
        baseUrl,
        apiKey,
        tunelleKey,
        rpm: rpm !== undefined ? Number(rpm) : 60,
        rpd: rpd !== undefined ? Number(rpd) : 10000,
        enabled: enabled !== undefined ? enabled : true,
      });
    }

    // Optional: Auto-refresh models when a provider is added/updated
    // await refreshModels();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Provider Action Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
