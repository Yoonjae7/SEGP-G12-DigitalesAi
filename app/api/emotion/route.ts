import { NextResponse } from 'next/server';
import { emotion } from '@/lib/ai';
import { EmotionRequestSchema } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/emotion { text }. A labelled guess, never graded. The text is not stored. */
export async function POST(req: Request) {
  const forceFail = new URL(req.url).searchParams.get('fail') === '1';
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const parsed = EmotionRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    return NextResponse.json(await emotion(parsed.data.text, { forceFail }), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
