// routes/profile.js — Modifier son propre profil
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const router  = express.Router();

router.use((req, res, next) => {
  if (!req.session?.user) return res.json({ ok: false, err: 'Non connecté' });
  next();
});

// POST /api/profile
router.post('/', async (req, res) => {
  const u      = req.session.user;
  const { action } = req.body ?? {};

  try {
    // ── Modifier le nom ──────────────────────────────────────────
    if (action === 'rename') {
      const nom = (req.body.nom ?? '').trim();
      if (nom.length < 2) return res.json({ ok: false, err: 'Nom trop court' });

      await db.execute('UPDATE users SET nom = ? WHERE id = ?', [nom, u.id]);
      req.session.user.nom = nom;
      return res.json({ ok: true, nom });
    }

    // ── Modifier le mot de passe ─────────────────────────────────
    if (action === 'passwd') {
      const oldPwd = req.body.old ?? '';
      const newPwd = req.body.new ?? '';

      if (newPwd.length < 6)
        return res.json({ ok: false, err: 'Nouveau mot de passe trop court (min 6 car.)' });

      const [[row]] = await db.execute('SELECT password FROM users WHERE id = ?', [u.id]);
      const hash = row.password;

      // Supporte bcrypt + ancien clair
      const ok = await bcrypt.compare(oldPwd, hash) || hash === oldPwd;
      if (!ok) return res.json({ ok: false, err: 'Mot de passe actuel incorrect' });

      const newHash = await bcrypt.hash(newPwd, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, u.id]);
      return res.json({ ok: true });
    }

    res.json({ ok: false, err: 'Action inconnue' });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
