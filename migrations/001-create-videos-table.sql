CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  duration integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
