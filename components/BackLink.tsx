'use client';

import { useRouter } from 'next/navigation';

/** Goes back to where the learner came from, or to the home page if there is nowhere to go back to. */
export function BackLink({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className="linkbtn" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
      {children}
    </button>
  );
}
