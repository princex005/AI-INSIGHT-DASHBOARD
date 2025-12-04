/*
  # Create user_events table for analytics

  Tracks anonymous user movement and key actions in the app.
*/

CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  session_id text,
  email text,
  event_type text NOT NULL,
  page text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts for analytics"
  ON user_events
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
