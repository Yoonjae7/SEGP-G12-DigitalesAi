/** Anonymous event log. Free text stays in the browser. See README: Privacy. */
export type EventName =
  | 'session_start'
  | 'age_gate_pass'
  | 'input_submitted'
  | 'emotion_guess'
  | 'emotion_final'
  | 'appraisal'
  | 'scene_enter'
  | 'choice'
  | 'why_submit'
  | 'score_response'
  | 'score_error'
  | 'score_unavailable'
  | 'followup_shown'
  | 'harder_shown'
  | 'nudge_shown'
  | 'skipped'
  | 'support_shown'
  | 'ending'
  | 'feedback_ask_tap'
  | 'fallback_2d'
  | 'fallback_to_mock'
  | 'exit'
  | `reflect_${string}`;

export interface LogEvent {
  sessionId: string;
  ts: number;
  event: EventName;
  payload: Record<string, unknown>;
}

export function makeEvent(sessionId: string | null, event: EventName, payload: Record<string, unknown> = {}, ts = Date.now()): LogEvent {
  return { sessionId: sessionId ?? 'no-session', ts, event, payload };
}
