// server.js — LPA Hirschmann Automotive Oujda
const express = require('express');
const session = require('express-session');
const path    = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use(session({
  secret:            'lpa-hirschmann-secret-2024',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge:   8 * 60 * 60 * 1000,   // 8 heures
  },
}));

// ── Fichiers statiques (index.html, logo.png…) ───────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes API ────────────────────────────────────────────────
app.use('/api',         require('./routes/auth'));
app.use('/api/data',    require('./routes/data'));
app.use('/api/save',    require('./routes/save'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/export',  require('./routes/export'));
app.use('/api/stats',   require('./routes/stats'));   // ← Super Admin stats

// ── SPA fallback : toute route inconnue → index.html ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  LPA Server running → http://localhost:${PORT}`);
});

/*
  ──────────────────────────────────────────────────────────────
  CRÉATION DU COMPTE SUPER ADMIN (à exécuter UNE FOIS en MySQL)
  ──────────────────────────────────────────────────────────────
  INSERT INTO users (username, password, nom, niveau, role, zone)
  VALUES ('super_admin', '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'Administrateur', 1, 'super_admin', '');

  Ou depuis Node.js :
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('votre_mot_de_passe', 10);
    // puis insérez avec role = 'super_admin'
  ──────────────────────────────────────────────────────────────
*/
