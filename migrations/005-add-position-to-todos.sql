ALTER TABLE todos ADD COLUMN IF NOT EXISTS position INTEGER;

UPDATE todos AS t
SET position = sub.rownum
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY created_at ASC) AS rownum
  FROM todos
) AS sub
WHERE t.id = sub.id
  AND t.position IS NULL;

ALTER TABLE todos ALTER COLUMN position SET DEFAULT 0;
ALTER TABLE todos ALTER COLUMN position SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_todos_list_id_position ON todos(list_id, position);