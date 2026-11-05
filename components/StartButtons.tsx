'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';
import { useSession } from './SessionProvider';

const h = copy.home;

/** The Home buttons. If a story is under way in this browser, offer Continue and Start again, so nobody is dropped into the middle by surprise. */
export function StartButtons() {
  const { state, ready, dispatch } = useSession();
  const router = useRouter();
  const has = ready && !!state.sessionId;
  const underWay = has && state.step !== 'end';
  const finished = has && state.step === 'end';
  const startFresh = () => { dispatch({ t: 'wipe' }); router.push('/start'); };

  return (
    <div className="cta">
      {underWay ? (
        <>
          <Link className="btn" href="/start">{h.continue}</Link>
          <button className="linkbtn" onClick={startFresh}>{h.again}</button>
        </>
      ) : (
        <>
          {finished
            ? <button className="btn" onClick={startFresh}>{h.start}</button>
            : <Link className="btn" href="/start">{h.start}</Link>}
          <a className="linkbtn" href="#how">{h.how}</a>
        </>
      )}
    </div>
  );
}
