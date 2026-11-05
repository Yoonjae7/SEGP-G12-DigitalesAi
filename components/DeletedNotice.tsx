'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { copy } from '@/lib/copy';

function Inner() {
  const q = useSearchParams();
  if (q.get('deleted') !== '1') return null;
  return (
    <p role="status" style={{ maxWidth: 1312, margin: '16px auto 0', padding: '0 64px', fontSize: 18 }}>
      <b>{copy.end.deleted}</b>
    </p>
  );
}

export function DeletedNotice() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
