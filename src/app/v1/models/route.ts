import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providers, models } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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
  
  // Fetch models for this provider
  const providerModels = await db.select().from(models).where(eq(models.providerId, provider.id));

  return NextResponse.json({
    object: 'list',
    data: providerModels.map(m => ({
      id: m.id,
      object: 'model',
      created: Date.now(),
      owned_by: provider.name,
    }))
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
