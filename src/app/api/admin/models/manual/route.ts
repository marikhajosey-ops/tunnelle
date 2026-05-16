import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { models } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    const { modelId, providerId } = await req.json();
    
    if (!modelId || !providerId) {
      return NextResponse.json({ error: 'Missing modelId or providerId' }, { status: 400 });
    }

    await db.insert(models).values({
      id: modelId,
      name: modelId,
      providerId: providerId,
    }).onConflictDoUpdate({
      target: [models.id, models.providerId],
      set: { name: modelId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
