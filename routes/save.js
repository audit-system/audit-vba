// routes/save.js — Enregistrement d'un audit (avec photos NA)
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// POST /api/save
router.post('/', async (req, res) => {
  if (!req.session?.user) return res.json({ ok: false, err: 'Non connecté' });

  const u = req.session.user;
  const b = req.body ?? {};

  try {
    // Réponses : array ou objet -> toujours array JSON
    const rep = Array.isArray(b.reponses)
      ? JSON.stringify(b.reponses)
      : (typeof b.reponses === 'object'
          ? JSON.stringify(Object.values(b.reponses))
          : '[]');

    const O  = parseInt(b.conformes     ?? 0);
    const X  = parseInt(b.non_conformes ?? 0);
    const sc = (O + X) > 0 ? Math.round(O / (O + X) * 100) : 0;

    // Photos : objet { "2": "data:image/jpeg;base64,...", "5": "..." }
    // On stocke tel quel en JSON (clé = index question)
    const photos = (b.photos && typeof b.photos === 'object' && Object.keys(b.photos).length > 0)
      ? JSON.stringify(b.photos)
      : null;

    const [result] = await db.execute(
      `INSERT INTO soumissions
        (date_audit, niveau, username, nom_auditeur, zone, shift, semaine, mois,
         reponses, observations, conformes, non_conformes, score, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.date_audit ?? new Date().toISOString().split('T')[0],
        parseInt(b.niveau ?? u.niveau),
        u.username,
        u.nom,
        b.zone        ?? '',
        b.shift       ?? '',
        b.semaine     ?? '',
        b.mois        ?? '',
        rep,
        b.observations ?? '',
        O, X, sc,
        photos,
      ]
    );

    res.json({ ok: true, id: result.insertId, score: sc });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
