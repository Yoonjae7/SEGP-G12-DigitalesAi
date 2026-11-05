import Link from 'next/link';
import { Footer, TopBar } from '@/components/Brand';
import { DeletedNotice } from '@/components/DeletedNotice';
import { HomeDiorama } from '@/components/HomeDiorama';
import { Mark } from '@/components/Marks';
import { copy } from '@/lib/copy';
import { story } from '@/lib/story';

const MARKS = ['mk-tell', 'mk-choice', 'mk-why', 'mk-see'] as const;

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
            <h1>
              <span>{l1}</span>
              <span>{l2}</span>
              <span>
                {l3.slice(0, markAt)}
                <span className="hl">{h.headlineMark}</span>
              </span>
            </h1>
            <p className="lede">{h.lede}</p>
            <div className="cta">
              <Link className="btn" href="/start">{h.start}</Link>
              <a className="linkbtn" href="#how">{h.how}</a>
            </div>
          </div>
          <div className="hero-art">
            <HomeDiorama />
            <p className="cap">{h.dioramaCaption}</p>
          </div>
        </section>

        <section className="facts" aria-label="At a glance">
          <ul>{h.facts.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className="how grid" id="how">
          <h2>{h.howTitle}</h2>
          <p className="sub">{h.howSub}</p>
          <div className="tabs">
            {h.steps.map((s, i) => (
              <article className="tab" data-n={i + 1} key={s.title}>
                <Mark id={MARKS[i]} size={72} className="mk" />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sample grid" aria-labelledby="sample-h">
          <div className="intro">
            <span className="eyebrow">{h.sample.eyebrow}</span>
            <h2 id="sample-h">{h.sample.title}</h2>
            <p>{h.sample.intro1}</p>
            <p className="soft">{h.sample.intro2}</p>
          </div>
          <div className="card">
            <div className="notebook">
              <div className="holes" aria-hidden="true"><i /><i /><i /></div>
              <span className="eyebrow">{h.sample.whyLabel}</span>
              <p className="q">{story.whys.why1.question}</p>
              <div className="ans"><span className="eyebrow lab">{h.sample.answerLabel}</span>{h.sample.answer}</div>
              <div className="arrow"><span className="dot" aria-hidden="true" />{h.sample.reply}</div>
              <div className="fu">
                <span className="eyebrow lab">{h.sample.followupLabel}</span>
                {h.sample.followupBefore}
                <span className="hl">{h.sample.followupMark}</span>
                {h.sample.followupAfter}
              </div>
              <p className="note">{h.sample.note}</p>
            </div>
          </div>
        </section>

        <section className="before grid" aria-labelledby="before-h">
          <div className="box">
            <h2 id="before-h">{h.before.title}</h2>
            <ul>{h.before.items.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="supp"><Link href="/support">{copy.nav.support}</Link></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

