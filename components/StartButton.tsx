'use client';

import Link from 'next/link';
import { copy } from '@/lib/copy';
import { useSession } from './SessionProvider';

/** Every start is from the beginning. Anything saved from an earlier run is cleared first, so the age check and the notes always show. */
export function StartButton() {
  const { dispatch } = useSession();
  return (
    <div className="cta">
      <Link className="btn" href="/start" onClick={() => dispatch({ t: 'wipe' })}>{copy.home.start}</Link>
    </div>
  );
}
