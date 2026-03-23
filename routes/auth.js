// routes/auth.js — Authentification
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const router  = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  console.log('[LOGIN] username:', username, '| password:', password);

  if (!username || !password) return res.json({ ok: false });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const u = rows[0];
    console.log('[LOGIN] user found:', u ? 'OUI' : 'NON');
    if (!u) return res.json({ ok: false });

    console.log('[LOGIN] password in DB:', u.password);

    let ok = false;

    // 1. Tester bcrypt
    try {
      ok = await bcrypt.compare(password, u.password);
      console.log('[LOGIN] bcrypt.compare result:', ok);
    } catch (bcryptErr) {
      console.log('[LOGIN] bcrypt.compare error:', bcryptErr.message);
      ok = false;
    }

    // 2. Fallback clair
    if (!ok) {
      console.log('[LOGIN] testing plain text:', u.password === password);
      if (u.password === password) {
        const hash = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, u.id]);
        ok = true;
        console.log('[LOGIN] plain text match → migré vers bcrypt');
      }
    }

    console.log('[LOGIN] final ok:', ok);
    if (!ok) return res.json({ ok: false });

    req.session.user = u;
    res.json({
      ok: true,
      user: {
        id:       u.id,
        username: u.username,
        nom:      u.nom,
        niveau:   parseInt(u.niveau),
        role:     u.role,
        zone:     u.zone,
      },
    });
  } catch (e) {
    console.log('[LOGIN] EXCEPTION:', e.message);
    res.json({ ok: false, err: e.message });
  }
});

// GET /api/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
