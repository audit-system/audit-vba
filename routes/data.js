// routes/data.js — Données dashboard filtrées par niveau
const express = require('express');
const db      = require('../db');
const router  = express.Router();

const COLS = `id, date_audit, date_saisie, niveau, username,
  nom_auditeur, zone, shift, semaine, mois, reponses, observations,
  conformes, non_conformes, score`;

// Middleware auth
router.use((req, res, next) => {
  if (!req.session?.user) return res.json({ ok: false, rows: [] });
  next();
});

// GET /api/data
router.get('/', async (req, res) => {
  const u  = req.session.user;
  const lv = parseInt(u.niveau);

  try {
    let rows;

    // super_admin et niveau 1 voient tout
    if (u.role === 'super_admin' || lv === 1) {
      [rows] = await db.execute(
        `SELECT ${COLS} FROM soumissions ORDER BY date_saisie DESC LIMIT 300`
      );
    } else if (lv === 2) {
      [rows] = await db.execute(
        `SELECT ${COLS} FROM soumissions WHERE niveau >= 2 ORDER BY date_saisie DESC LIMIT 300`
      );
    } else {
      // Niveau 3 : ses soumissions uniquement
      [rows] = await db.execute(
        `SELECT ${COLS} FROM soumissions WHERE username = ? ORDER BY date_saisie DESC LIMIT 300`,
        [u.username]
      );
    }

    rows = rows.map(r => ({
      ...r,
      reponses:      JSON.parse(r.reponses ?? '[]'),
      niveau:        parseInt(r.niveau),
      conformes:     parseInt(r.conformes),
      non_conformes: parseInt(r.non_conformes),
      score:         parseInt(r.score),
    }));

    res.json({ ok: true, rows });
  } catch (e) {
    res.json({ ok: false, err: e.message, rows: [] });
  }
});

module.exports = router;
