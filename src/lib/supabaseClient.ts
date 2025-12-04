import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not set. Analytics and blog features may not work correctly.');
}

function getOrCreateSessionId(): string {
  const key = 'insightai_session_id';
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh = self.crypto?.randomUUID ? self.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return 'unknown-session';
  }
}

type TrackEventParams = {
  eventType: string;
  page: string;
  email?: string | null;
  metadata?: Record<string, unknown>;
};

export async function trackEvent({ eventType, page, email, metadata }: TrackEventParams): Promise<void> {
  if (!supabase) return;

  const sessionId = getOrCreateSessionId();

  try {
    await supabase.from('user_events').insert({
      event_type: eventType,
      page,
      email: email ?? null,
      session_id: sessionId,
      metadata: metadata ?? {},
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to track analytics event', error);
  }
}
