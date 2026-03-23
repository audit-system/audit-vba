// routes/admin.js — Gestion des utilisateurs (niveau 1 uniquement)
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const router  = express.Router();

// Middleware : authentifié + niveau 1
router.use((req, res, next) => {
  if (!req.session?.user)               return res.json({ ok: false, err: 'Non connecté' });
  if (parseInt(req.session.user.niveau) !== 1) return res.json({ ok: false, err: 'Accès refusé' });
  next();
});

// GET /api/admin?action=list
router.get('/', async (req, res) => {
  if (req.query.action !== 'list') return res.json({ ok: false, err: 'Action inconnue' });
  try {
    const [rows] = await db.execute(
      'SELECT id, username, nom, niveau, role, zone FROM users ORDER BY niveau, username'
    );
    res.json({ ok: true, users: rows });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

// POST /api/admin
router.post('/', async (req, res) => {
  const { action } = req.body ?? {};

  try {
    // ── Ajouter ────────────────────────────────────────────────
    if (action === 'add') {
      const { username, nom, password, niveau, role, zone } = req.body;
      if (!username || !nom || (password ?? '').length < 6 || ![1,2,3].includes(parseInt(niveau)))
        return res.json({ ok: false, err: 'Données invalides (mdp min 6 car.)' });

      const [[existing]] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
      if (existing) return res.json({ ok: false, err: `L'identifiant '${username}' existe déjà` });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (username, password, nom, niveau, role, zone) VALUES (?,?,?,?,?,?)',
        [username, hash, nom, parseInt(niveau), role ?? '', zone ?? '']
      );
      return res.json({ ok: true, id: result.insertId });
    }

    // ── Modifier ────────────────────────────────────────────────
    if (action === 'edit') {
      const { id, nom, role, zone, niveau, password } = req.body;
      if (!id || (nom ?? '').length < 2)
        return res.json({ ok: false, err: 'Données invalides' });

      const niv = parseInt(niveau);
      if ([1,2,3].includes(niv)) {
        await db.execute('UPDATE users SET nom=?, role=?, zone=?, niveau=? WHERE id=?',
          [nom, role ?? '', zone ?? '', niv, id]);
      } else {
        await db.execute('UPDATE users SET nom=?, role=?, zone=? WHERE id=?',
          [nom, role ?? '', zone ?? '', id]);
      }

      if ((password ?? '').length >= 6) {
        const hash = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password=? WHERE id=?', [hash, id]);
      }

      return res.json({ ok: true });
    }

    // ── Supprimer ────────────────────────────────────────────────
    if (action === 'delete') {
      const { id } = req.body;
      if (parseInt(id) === parseInt(req.session.user.id))
        return res.json({ ok: false, err: 'Impossible de se supprimer soi-même' });

      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ ok: true });
    }

    res.json({ ok: false, err: 'Action inconnue' });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
