import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers, models } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const tunelleKey = authHeader.split(' ')[1];
  
  // Find provider by Tunelle Key
  const p = await db.select().from(providers).where(eq(providers.tunelleKey, tunelleKey)).limit(1);

  if (p.length === 0) {
    return NextResponse.json({ error: 'Invalid Tunelle Key' }, { status: 401 });
  }

  const provider = p[0];
  if (!provider.enabled) {
    return NextResponse.json({ error: 'Provider is disabled' }, { status: 403 });
  }

  // Fetch models for this specific provider
  const m = await db.select().from(models).where(eq(models.providerId, provider.id));
  
  return NextResponse.json({
    object: "list",
    data: m.map(item => ({
      id: item.id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: provider.name
    }))
  });
}
