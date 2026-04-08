// routes/profile.js — Modifier son propre profil
const express        = require('express');
const bcrypt         = require('bcrypt');
const db             = require('../db');
const { t, getLang } = require('../i18n');
const router         = express.Router();

router.use((req, res, next) => {
  if (!req.session?.user)
    return res.json({ ok: false, err: t(getLang(req), 'err.not_connected') });
  next();
});

// POST /api/profile
router.post('/', async (req, res) => {
  const lang = getLang(req);
  const u    = req.session.user;
  const { action } = req.body ?? {};

  try {
    // ── Rename ───────────────────────────────────────────────
    if (action === 'rename') {
      const nom = (req.body.nom ?? '').trim();
      if (nom.length < 2)
        return res.json({ ok: false, err: t(lang, 'profile.name_too_short') });

      await db.execute('UPDATE users SET nom = ? WHERE id = ?', [nom, u.id]);
      req.session.user.nom = nom;
      return res.json({ ok: true, nom });
    }

    // ── Change password ──────────────────────────────────────
    if (action === 'passwd') {
      const oldPwd = req.body.old ?? '';
      const newPwd = req.body.new ?? '';

      if (newPwd.length < 6)
        return res.json({ ok: false, err: t(lang, 'profile.pwd_too_short') });

      const [[row]] = await db.execute('SELECT password FROM users WHERE id = ?', [u.id]);
      const hash    = row.password;

      // Support bcrypt + legacy plaintext
      const ok = await bcrypt.compare(oldPwd, hash) || hash === oldPwd;
      if (!ok)
        return res.json({ ok: false, err: t(lang, 'profile.pwd_wrong') });

      const newHash = await bcrypt.hash(newPwd, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHash, u.id]);
      return res.json({ ok: true });
    }

    res.json({ ok: false, err: t(lang, 'profile.unknown_action') });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
