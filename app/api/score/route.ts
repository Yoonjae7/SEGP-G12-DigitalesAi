import { NextResponse } from 'next/server';
import { score } from '@/lib/ai';
import { ScoreRequestSchema } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/score. The learner's text is read, scored and returned. It is never stored or logged here. */
export async function POST(req: Request) {
  const forceFail = new URL(req.url).searchParams.get('fail') === '1';
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const parsed = ScoreRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    const result = await score(parsed.data, { forceFail });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
