import { NextResponse } from 'next/server';
import { match } from '@/lib/ai';
import { MatchRequestSchema } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/match { text?, theme? }. This prototype has one story, so it always returns that story. */
export async function POST(req: Request) {
  const forceFail = new URL(req.url).searchParams.get('fail') === '1';
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const parsed = MatchRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    return NextResponse.json(await match(parsed.data, { forceFail }), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
