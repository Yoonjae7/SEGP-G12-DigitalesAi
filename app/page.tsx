import { Footer, TopBar } from '@/components/Brand';
import { WellbeingEmail } from '@/components/Contact';
import { DeletedNotice } from '@/components/DeletedNotice';
import { StartButton } from '@/components/StartButton';
import { copy } from '@/lib/copy';

export default function Home() {
  const h = copy.home;
  const [l1, l2, l3] = h.headline;
  const markAt = l3.indexOf(h.headlineMark);
  return (
    <div className="p-home">
      <a className="sr" href="#main">Skip to content</a>
      <TopBar />
      <main id="main">
        <DeletedNotice />
        <section className="hero grid">
          <div className="hero-text">
            <span className="eyebrow">{h.eyebrow}</span>
            <h1>
              <span>{l1}</span>
              <span>{l2}</span>
              <span>
                {l3.slice(0, markAt)}
                <span className="hl">{h.headlineMark}</span>
                {l3.slice(markAt + h.headlineMark.length)}
              </span>
            </h1>
            <p className="lede">{h.lede}</p>
            <StartButton />
          </div>
          <aside className="hero-note" aria-labelledby="note-h">
            <h2 id="note-h">{h.notice.title}</h2>
            <p>{h.notice.text}</p>
            <p className="mail-line">{h.notice.contact} <WellbeingEmail /></p>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
