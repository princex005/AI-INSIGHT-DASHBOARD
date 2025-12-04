/*
  Add read access policy for user_events so the frontend analytics page
  can query events using the anon key.
*/

ALTER TABLE IF EXISTS user_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone with access to the anon key to read analytics events.
-- If you want to restrict this later, you can tighten the USING() clause.
CREATE POLICY IF NOT EXISTS "Allow anonymous select for analytics"
  ON user_events
  FOR SELECT
  USING (true);
