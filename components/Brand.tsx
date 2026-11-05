import Link from 'next/link';
import { copy } from '@/lib/copy';

/** "DigiTales" in Young Serif. The persimmon ping dot is the dot of the second "i". Small "AI" after it. */
export function Wordmark({ small, href = '/', label = 'DigiTales AI, home', as = 'link' }: { small?: boolean; href?: string; label?: string; as?: 'link' | 'span' }) {
  const inner = (
    <>
      Dig<span className="wm-i" aria-hidden="true">{'ı'}</span>Tales<span className="wm-ai" aria-hidden="true">AI</span>
    </>
  );
  if (as === 'span') return <span className={`wordmark${small ? ' sm' : ''}`} role="img" aria-label="DigiTales AI">{inner}</span>;
  return <Link className={`wordmark${small ? ' sm' : ''}`} href={href} aria-label={label}>{inner}</Link>;
}

/** Top bar for every page outside the story: wordmark left, two plain links right. No hamburger. */
export function TopBar() {
  return (
    <header className="topbar">
      <Wordmark />
      <nav aria-label="Site">
        <Link href="/about">{copy.nav.about}</Link>
        <Link href="/support">{copy.nav.support}</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>{copy.footer.line}</span>
      <nav aria-label="Footer">
        <Link href="/about">{copy.nav.about}</Link>
        <Link href="/support">{copy.nav.support}</Link>
      </nav>
    </footer>
  );
}
