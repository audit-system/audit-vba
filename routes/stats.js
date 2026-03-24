// routes/stats.js — Statistiques avancées (super_admin uniquement)
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// Middleware : super_admin uniquement
router.use((req, res, next) => {
  if (!req.session?.user)
    return res.json({ ok: false, err: 'Non connecté' });
  if (req.session.user.role !== 'super_admin')
    return res.json({ ok: false, err: 'Accès refusé' });
  next();
});

router.get('/', async (req, res) => {
  try {
    // ── Stats par niveau ──────────────────────────────────────
    const levelStats = {};
    for (const lv of [1, 2, 3]) {
      const [[s]] = await db.execute(
        `SELECT
           COUNT(*)                                              AS nb,
           IFNULL(ROUND(AVG(score), 1), 0)                     AS moy,
           SUM(CASE WHEN score >= 84             THEN 1 ELSE 0 END) AS high_count,
           SUM(CASE WHEN score >= 70 AND score < 84 THEN 1 ELSE 0 END) AS mid_count,
           SUM(CASE WHEN score < 70              THEN 1 ELSE 0 END) AS low_count
         FROM soumissions WHERE niveau = ?`,
        [lv]
      );
      levelStats[lv] = {
        nb:          parseInt(s.nb),
        score_moyen: parseFloat(s.moy),
        high_count:  parseInt(s.high_count),
        mid_count:   parseInt(s.mid_count),
        low_count:   parseInt(s.low_count),
      };
    }

    // ── Score moyen par auditeur ──────────────────────────────
    const [userRows] = await db.execute(
      `SELECT username, nom_auditeur, niveau,
              COUNT(*) AS nb, ROUND(AVG(score), 1) AS moy_score
       FROM soumissions
       GROUP BY username, nom_auditeur, niveau
       ORDER BY niveau, moy_score DESC`
    );

    // ── 50 dernières soumissions (avec réponses + photos pour le détail) ──
    const [recent] = await db.execute(
      `SELECT id, date_audit, date_saisie, niveau, username,
              nom_auditeur, zone, shift, semaine, mois, observations,
              reponses, photos, conformes, non_conformes, score
       FROM soumissions ORDER BY date_saisie DESC LIMIT 50`
    );

    // ── Réponses X par question (sur les 1 000 dernières) ────
    const [allRows] = await db.execute(
      `SELECT niveau, reponses FROM soumissions ORDER BY date_saisie DESC LIMIT 1000`
    );
    const questionX = { 1: {}, 2: {}, 3: {} };
    for (const row of allRows) {
      try {
        let reps = JSON.parse(row.reponses ?? '[]');
        const lv = parseInt(row.niveau);
        if (!questionX[lv]) continue;

        if (Array.isArray(reps)) {
          reps.forEach((val, idx) => {
            if (val === 'X')
              questionX[lv][idx] = (questionX[lv][idx] || 0) + 1;
          });
        } else if (typeof reps === 'object') {
          Object.entries(reps).forEach(([idx, val]) => {
            if (val === 'X')
              questionX[lv][parseInt(idx)] = (questionX[lv][parseInt(idx)] || 0) + 1;
          });
        }
      } catch { /* ligne corrompue ignorée */ }
    }

    // ── Totaux globaux ────────────────────────────────────────
    const [[{ total_users }]] = await db.execute(
      `SELECT COUNT(*) AS total_users FROM users WHERE role != 'super_admin' OR role IS NULL`
    );
    const [[{ week_nb }]] = await db.execute(
      `SELECT COUNT(*) AS week_nb FROM soumissions
       WHERE date_saisie >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    res.json({
      ok: true,
      levelStats,
      userStats: userRows.map(r => ({
        ...r,
        nb:        parseInt(r.nb),
        moy_score: parseFloat(r.moy_score),
        niveau:    parseInt(r.niveau),
      })),
      recent: recent.map(r => ({
        ...r,
        niveau:        parseInt(r.niveau),
        conformes:     parseInt(r.conformes),
        non_conformes: parseInt(r.non_conformes),
        score:         parseInt(r.score),
        reponses:      (() => { try { return JSON.parse(r.reponses ?? '[]'); } catch { return []; } })(),
        photos:        (() => { try { return r.photos ? JSON.parse(r.photos) : {}; } catch { return {}; } })(),
      })),
      questionX,
      total_users: parseInt(total_users),
      week_nb:     parseInt(week_nb),
    });
  } catch (e) {
    res.status(500).json({ ok: false, err: e.message });
  }
});

module.exports = router;
