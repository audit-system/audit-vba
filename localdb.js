// db.js — Connexion MySQL (pool)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            'localhost',
  database:        'lpa_db',
  user:            'root',
  password:        '',          // XAMPP/WAMP = vide par défaut
  waitForConnections: true,
  connectionLimit: 10,
  charset:         'utf8mb4',
});

module.exports = pool;
