// routes/export.js — JSON export for VBA Excel
const express = require('express');
const db      = require('../db');
const router  = express.Router();

router.get('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const niveau = parseInt(req.query.niveau);
    const limit  = Math.min(parseInt(req.query.limit ?? 500), 1000);

    let sql = `SELECT id, date_audit, date_saisie, niveau, username,
      nom_auditeur, zone, shift, semaine, mois, reponses, observations,
      conformes, non_conformes, score, photos
      FROM soumissions`;
    const params = [];

    if ([1, 2, 3].includes(niveau)) {
      sql += ' WHERE niveau = ?';
      params.push(niveau);
    }
    sql += ` ORDER BY date_saisie DESC LIMIT ${limit}`;

    let [rows] = await db.execute(sql, params);

    rows = rows.map(r => ({
      ...r,
      reponses:      JSON.parse(r.reponses  ?? '[]'),
      photos:        r.photos ? JSON.parse(r.photos) : {},
      niveau:        parseInt(r.niveau),
      conformes:     parseInt(r.conformes),
      non_conformes: parseInt(r.non_conformes),
      score:         parseInt(r.score),
    }));

    // Stats per level
    const stats = {};
    for (const lv of [1, 2, 3]) {
      const [[s]] = await db.execute(
        'SELECT COUNT(*) AS nb, IFNULL(ROUND(AVG(score),1),0) AS moy FROM soumissions WHERE niveau=?',
        [lv]
      );
      stats[`lpa${lv}`] = { nb: parseInt(s.nb), score_moyen: parseFloat(s.moy) };
    }

    res.json({
      statut:      'ok',
      total:       rows.length,
      stats,
      soumissions: rows,
      genere_le:   new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
  } catch (e) {
    res.status(500).json({ statut: 'erreur', message: e.message });
  }
});

module.exports = router;
