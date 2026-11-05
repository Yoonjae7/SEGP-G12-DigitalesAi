import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Young_Serif } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import { SvgDefs } from '@/components/SvgDefs';
import './globals.css';
import './pages.css';

const display = Young_Serif({ weight: '400', subsets: ['latin'], variable: '--ff-display', display: 'swap' });
const body = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--ff-body', display: 'swap', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: { default: 'DigiTales AI', template: '%s | DigiTales AI' },
  description: 'A short interactive story for adults about online life. You choose. Then you say why.',
  robots: { index: false, follow: false }, // a closed pilot
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F4EEE3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} data-text="0">
      <body>
        <SvgDefs />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
