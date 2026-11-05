import type { Metadata } from 'next';
import { Footer, TopBar } from '@/components/Brand';
import { copy } from '@/lib/copy';

export const metadata: Metadata = { title: 'About and AI use' };

export default function About() {
  const a = copy.about;
  return (
    <div className="p-about">
      <TopBar />
      <main className="about grid">
        <div className="head">
          <h1>{a.title}</h1>
          <p>{a.lead}</p>
          <p className="small soft">{copy.footer.line}</p>
        </div>
        <div className="list">
          {a.rows.map((r) => (
            <div className={`row${r.k === 'What it does not do' ? ' no' : ''}`} key={r.k}>
              <span className="k">{r.k}</span>
              {r.k === 'Reading your answers' ? (
                <div><p>{r.t}</p><p><span className="tag-demo">{a.tag}</span></p></div>
              ) : (
                <p>{r.t}</p>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
