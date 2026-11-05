import type { Metadata } from 'next';
import { StartFlow } from '@/components/StartFlow';

export const metadata: Metadata = { title: 'Start' };

export default function StartPage() {
  return <StartFlow />;
}
