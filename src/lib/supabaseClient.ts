import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ✅ Create Supabase client safely
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Analytics and blog features may not work correctly.'
  );
}

// ------------------------------------------------------
// ⭐ SESSION ID GENERATOR — used when no email available
// ------------------------------------------------------
function getOrCreateSessionId(): string {
  const key = 'insightai_session_id';

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const fresh = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return 'unknown-session';
  }
}

// ------------------------------------------------------
// ⭐ trackEvent() — FIXED to match your `user_analytics` table
// ------------------------------------------------------
type TrackEventParams = {
  eventType: string;                       // "click" | "visit" | "modal_open"
  page: string;                            // e.g. "/app" or "/"
  email?: string | null;                   // if available
  metadata?: Record<string, unknown>;      // any extra info
};

export async function trackEvent({
  eventType,
  page,
  email,
  metadata
}: TrackEventParams): Promise<void> {
  if (!supabase) return;

  const sessionId = getOrCreateSessionId();

  try {
    await supabase.from('user_analytics').insert({
      user_id: email ?? sessionId,                   // Fallback to session ID if email missing
      page_visited: page,
      event_type: eventType,
      event_detail: JSON.stringify(metadata ?? {}), // Convert metadata object → string
      device: navigator.userAgent                   // User device information
    });
  } catch (error) {
    console.error('Failed to track analytics event', error);
  }
}
