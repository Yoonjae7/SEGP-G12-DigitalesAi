import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, TopBar } from '@/components/Brand';
import { BackLink } from '@/components/BackLink';
import { copy } from '@/lib/copy';

export const metadata: Metadata = { title: 'Need support?' };

export default function Support() {
  const s = copy.support;
  const p = copy.placeholders;
  return (
    <div className="p-support">
      <TopBar />
      <main className="sup grid">
        <div className="main">
          <h1>{s.title}</h1>
          <p className="lead">{s.lead}</p>
          <div className="contacts">
            <div className="c"><span className="k">{s.wellbeing}</span><span className="v"><span className="ph">{p.wellbeing}</span></span></div>
            <div className="c"><span className="k">{s.emergency}</span><span className="v"><span className="ph">{p.emergency}</span></span></div>
          </div>
          <p className="danger">{s.danger}</p>
          <div className="back"><BackLink>{s.back}</BackLink><Link className="linkbtn" href="/">{s.home}</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
