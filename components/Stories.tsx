'use client';

import Link from 'next/link';
import { copy } from '@/lib/copy';
import { useSession } from './SessionProvider';

const S = copy.stories;

/** Stories 2, 3 and 4 are not made yet. They show as cards that cannot be opened. */
export function ComingSoon() {
  return (
    <>
      {S.soon.map((name) => (
        <li className="story soon" key={name} aria-disabled="true">
          <span className="n">{name}</span>
          <span className="badge">{S.soonLabel}</span>
        </li>
      ))}
    </>
  );
}

/** The Home shelf: Story 1 to play, then Story 2, 3 and 4 as Coming soon. Starting always begins from the beginning. */
export function StoryShelf() {
  const { dispatch } = useSession();
  return (
    <section className="shelf grid" aria-label={S.label}>
      <ul>
        <li className="story on">
          <Link href="/start" onClick={() => dispatch({ t: 'wipe' })}>
            <span className="n">{S.one.name}</span>
            <span className="t">{S.one.title}</span>
          </Link>
        </li>
        <ComingSoon />
      </ul>
    </section>
  );
}
