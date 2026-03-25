// routes/auth.js — Authentification
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const router  = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) return res.json({ ok: false });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const u = rows[0];
    if (!u) return res.json({ ok: false });

    let ok = false;
    try { ok = await bcrypt.compare(password, u.password); } catch { ok = false; }
    if (!ok && u.password === password) {
      const hash = await bcrypt.hash(password, 10);
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, u.id]);
      ok = true;
    }
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

// GET /api/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
