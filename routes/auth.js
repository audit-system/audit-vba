// routes/auth.js — Authentification
const express       = require('express');
const bcrypt        = require('bcrypt');
const db            = require('../db');
const { t, getLang} = require('../i18n');
const router        = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const lang = getLang(req);
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.json({ ok: false });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const u = rows[0];
    if (!u) return res.json({ ok: false });

    let ok = false;
<<<<<<< HEAD

    // 1. Test bcrypt
    try { ok = await bcrypt.compare(password, u.password); } catch { ok = false; }

    // 2. Fallback plaintext → migrate to bcrypt silently
=======
    try { ok = await bcrypt.compare(password, u.password); } catch { ok = false; }
>>>>>>> 8571ba75f8c55b1eb22c20bef0b8d366b6de7275
    if (!ok && u.password === password) {
      const hash = await bcrypt.hash(password, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, u.id]);
      ok = true;
    }
<<<<<<< HEAD

=======
>>>>>>> 8571ba75f8c55b1eb22c20bef0b8d366b6de7275
    if (!ok) return res.json({ ok: false });

    req.session.user = u;
    res.json({
      ok: true,
      user: {
        id:         u.id,
        username:   u.username,
        nom:        u.nom,
        niveau:     parseInt(u.niveau),
        role:       u.role,
        zone:       u.zone,
        email:      u.email      || '',
        specialite: u.specialite || '',
      },
    });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

// GET /api/me — restore session after page refresh (no re-login needed)
router.get('/me', (req, res) => {
  const u = req.session?.user;
  if (!u) return res.json({ ok: false });
  res.json({
    ok: true,
    user: {
      id:         u.id,
      username:   u.username,
      nom:        u.nom,
      niveau:     parseInt(u.niveau),
      role:       u.role,
      zone:       u.zone,
      email:      u.email      || '',
      specialite: u.specialite || '',
    },
  });
});

// GET /api/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
