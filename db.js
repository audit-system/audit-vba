// db.js — Connexion MySQL (pool)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            'mysql.railway.internal',
  database:        'railway',
  user:            'root',
  password:        'vutyVZqMmAILuQVdtEnmKmorRlhytxkM',          // XAMPP/WAMP = vide par défaut
  waitForConnections: true,
  connectionLimit: 10,
  charset:         'utf8mb4',
});

module.exports = pool;
