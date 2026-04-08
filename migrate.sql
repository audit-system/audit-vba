-- ══════════════════════════════════════════════════════════════
-- LPA migration — i18n + NA obs/assignees + user email/specialite
-- Run ONCE on the existing database
-- ══════════════════════════════════════════════════════════════

USE lpa_db;

-- 1. Add email and specialite to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email      VARCHAR(120) NOT NULL DEFAULT '' AFTER zone,
  ADD COLUMN IF NOT EXISTS specialite VARCHAR(100) NOT NULL DEFAULT '' AFTER email;

-- 2. Add per-question observations JSON to soumissions
ALTER TABLE soumissions
  ADD COLUMN IF NOT EXISTS q_observations MEDIUMTEXT DEFAULT NULL AFTER photos;

-- 3. Add NA assignees JSON to soumissions
ALTER TABLE soumissions
  ADD COLUMN IF NOT EXISTS na_assignees MEDIUMTEXT DEFAULT NULL AFTER q_observations;

-- 4. Widen password column for bcrypt (if still VARCHAR(50))
ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NOT NULL;
