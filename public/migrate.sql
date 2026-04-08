-- ══════════════════════════════════════════════════════════════
-- LPA migration — observations par question + NA assignment
-- À exécuter une seule fois sur la base existante
-- ══════════════════════════════════════════════════════════════

USE lpa_db;

-- 1. Ajouter email et specialite à la table users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email       VARCHAR(120) NOT NULL DEFAULT '' AFTER zone,
  ADD COLUMN IF NOT EXISTS specialite  VARCHAR(100) NOT NULL DEFAULT '' AFTER email;

-- 2. Ajouter q_observations (JSON) dans soumissions
--    stocke les observations per-question : { "3": "texte...", "7": "..." }
ALTER TABLE soumissions
  ADD COLUMN IF NOT EXISTS q_observations MEDIUMTEXT DEFAULT NULL AFTER photos;

-- 3. Ajouter na_assignees (JSON) dans soumissions
--    stocke l'utilisateur assigné pour chaque NA : { "3": "username", "7": "username2" }
ALTER TABLE soumissions
  ADD COLUMN IF NOT EXISTS na_assignees MEDIUMTEXT DEFAULT NULL AFTER q_observations;

-- 4. Table pour l'historique des emails envoyés (utile pour le dashboard admin)
CREATE TABLE IF NOT EXISTS email_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  soumission_id INT          NOT NULL,
  question_idx  TINYINT      NOT NULL,
  sent_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  from_username VARCHAR(50)  NOT NULL,
  to_username   VARCHAR(50)  NOT NULL,
  to_email      VARCHAR(120) NOT NULL,
  subject       VARCHAR(255) NOT NULL,
  has_photo     TINYINT(1)   NOT NULL DEFAULT 0,
  INDEX idx_soumission (soumission_id),
  INDEX idx_to_user    (to_username)
);
