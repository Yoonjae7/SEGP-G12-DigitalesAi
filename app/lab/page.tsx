import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LabClient } from '@/components/LabClient';

export const metadata: Metadata = { title: 'Lab (team only)', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Team only. Not linked anywhere. Open /lab?key=<LAB_KEY>. Without the right key it looks like a page that does not exist. */
export default async function LabPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  const expected = process.env.LAB_KEY;
  if (!expected || key !== expected) notFound();
  return <LabClient />;
}
