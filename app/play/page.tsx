import type { Metadata } from 'next';
import { Player } from '@/components/Player';

export const metadata: Metadata = { title: 'The story' };

export default function PlayPage() {
  return <Player />;
}
