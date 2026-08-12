CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
