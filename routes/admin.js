// routes/admin.js — Gestion des utilisateurs (super_admin uniquement)
const express        = require('express');
const bcrypt         = require('bcrypt');
const db             = require('../db');
const { t, getLang } = require('../i18n');
const router         = express.Router();

// ── Public route (any authenticated user) ───────────────────
// GET /api/admin/assignees — users list for NA dropdown in form
router.get('/assignees', async (req, res) => {
  if (!req.session?.user)
    return res.json({ ok: false, err: t(getLang(req), 'err.not_connected') });
  try {
    const [rows] = await db.execute(
      `SELECT id, username, nom, niveau, role, zone,
              IFNULL(email,'') AS email, IFNULL(specialite,'') AS specialite
       FROM users
       WHERE role != 'super_admin'
       ORDER BY niveau, nom`
    );
    res.json({ ok: true, users: rows });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

// ── Middleware: super_admin only for all routes below ────────
router.use((req, res, next) => {
  const lang = getLang(req);
  if (!req.session?.user)
    return res.json({ ok: false, err: t(lang, 'err.not_connected') });
  if (req.session.user.role !== 'super_admin')
    return res.json({ ok: false, err: t(lang, 'err.access_denied_sa') });
  next();
});

// GET /api/admin?action=list
router.get('/', async (req, res) => {
  const lang = getLang(req);
  if (req.query.action !== 'list')
    return res.json({ ok: false, err: t(lang, 'err.unknown_action') });
  try {
    const [rows] = await db.execute(
      `SELECT id, username, nom, niveau, role, zone,
              IFNULL(email,'') AS email, IFNULL(specialite,'') AS specialite
       FROM users ORDER BY niveau, username`
    );
    res.json({ ok: true, users: rows });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

// POST /api/admin
router.post('/', async (req, res) => {
  const lang = getLang(req);
  const { action } = req.body ?? {};

  try {
    // ── Add ─────────────────────────────────────────────────
    if (action === 'add') {
      const { username, nom, password, niveau, role, zone, email, specialite } = req.body;
      if (!username || !nom || (password ?? '').length < 6 || ![1, 2, 3].includes(parseInt(niveau)))
        return res.json({ ok: false, err: t(lang, 'admin.invalid_data') });

      const [[existing]] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
      if (existing)
        return res.json({ ok: false, err: t(lang, 'admin.username_exists', { u: username }) });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        `INSERT INTO users (username, password, nom, niveau, role, zone, email, specialite)
         VALUES (?,?,?,?,?,?,?,?)`,
        [username, hash, nom, parseInt(niveau), role ?? '', zone ?? '', email ?? '', specialite ?? '']
      );
      return res.json({ ok: true, id: result.insertId });
    }

    // ── Edit ─────────────────────────────────────────────────
    if (action === 'edit') {
      const { id, nom, role, zone, niveau, password, email, specialite } = req.body;
      if (!id || (nom ?? '').length < 2)
        return res.json({ ok: false, err: t(lang, 'admin.invalid_data_short') });

      // Prevent super_admin from changing their own role
      if (parseInt(id) === parseInt(req.session.user.id) && role === 'super_admin') {
        await db.execute(
          'UPDATE users SET nom=?, zone=?, email=?, specialite=? WHERE id=?',
          [nom, zone ?? '', email ?? '', specialite ?? '', id]
        );
      } else {
        const niv = parseInt(niveau);
        if ([1, 2, 3].includes(niv)) {
          await db.execute(
            'UPDATE users SET nom=?, role=?, zone=?, niveau=?, email=?, specialite=? WHERE id=?',
            [nom, role ?? '', zone ?? '', niv, email ?? '', specialite ?? '', id]
          );
        } else {
          await db.execute(
            'UPDATE users SET nom=?, role=?, zone=?, email=?, specialite=? WHERE id=?',
            [nom, role ?? '', zone ?? '', email ?? '', specialite ?? '', id]
          );
        }
      }

      if ((password ?? '').length >= 6) {
        const hash = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password=? WHERE id=?', [hash, id]);
      }
      return res.json({ ok: true });
    }

    // ── Delete ───────────────────────────────────────────────
    if (action === 'delete') {
      const { id } = req.body;
      if (parseInt(id) === parseInt(req.session.user.id))
        return res.json({ ok: false, err: t(lang, 'admin.cannot_delete_self') });
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ ok: true });
    }

    res.json({ ok: false, err: t(lang, 'err.unknown_action') });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
