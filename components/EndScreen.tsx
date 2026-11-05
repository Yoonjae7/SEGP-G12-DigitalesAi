'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';
import { downloadLog } from '@/lib/log/export';
import { Footer, TopBar } from './Brand';
import { useSession } from './SessionProvider';

/** The end. The learner can keep a copy of their log, delete everything, or play again. */
export function EndScreen() {
  const { state, dispatch, deleteData } = useSession();
  const router = useRouter();
  const E = copy.end;
  return (
    <div className="p-ending">
      <TopBar />
      <main className="end grid">
        <div className="main">
          <h1>{E.title}</h1>
          <div className="btns">
            <button className="btn" onClick={() => downloadLog(state)}>{E.download}</button>
            <button className="btn paper" onClick={() => { deleteData(); window.location.replace('/?deleted=1'); }}>{E.delete}</button>
            <button className="btn paper" onClick={() => { dispatch({ t: 'newSession' }); router.replace('/start'); }}>{E.again}</button>
          </div>
          <div className="links">
            <span className="ph">{copy.placeholders.survey}</span>
            <Link href="/support">{copy.nav.support}</Link>
            <span className="soft small">{E.note}</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

