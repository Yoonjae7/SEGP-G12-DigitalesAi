'use client';

import { EndScreen } from './EndScreen';
import { Feedback } from './Feedback';
import { Reflect } from './Reflect';
import { useSession, useStepGuard } from './SessionProvider';
import { Stage } from './Stage';

/** Everything after "Begin": the story, the ending, the feedback, Reflect, and the end screen. */
export function Player() {
  const { state, ready } = useSession();
  const ok = useStepGuard('/play');
  if (!ready || !ok) return <div className="on-night" style={{ minHeight: '100vh' }} aria-busy="true" />;
  switch (state.step) {
    case 'play': return <Stage />;
    case 'feedback': return <Feedback />;
    case 'reflect': return <Reflect />;
    case 'end': return <EndScreen />;
    default: return null;
  }
}
