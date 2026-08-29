-- Usuários antigos foram criados só com username, sem email.
-- Preenchemos um email de placeholder baseado no username (que já é único),
-- pra ninguém ficar sem conseguir logar depois que email virar obrigatório.
-- Quem quiser um email de verdade pode trocar depois em /profile.
UPDATE users
SET email = username || '@placeholder.local'
WHERE email IS NULL;

ALTER TABLE users ALTER COLUMN email SET NOT NULL;