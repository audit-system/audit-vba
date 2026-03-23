// server.js — LPA Hirschmann Automotive Oujda
const express = require('express');
const session = require('express-session');
const path    = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
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

// ── SPA fallback : toute route inconnue → index.html ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  LPA Server running → http://localhost:${PORT}`);
});
