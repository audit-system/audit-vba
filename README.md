# LPA System — Node.js

## Structure
```
LPA_NodeJS/
├── server.js          ← Point d'entrée
├── db.js              ← Connexion MySQL
├── package.json
├── routes/
│   ├── auth.js        ← POST /api/login  GET /api/logout
│   ├── data.js        ← GET  /api/data
│   ├── save.js        ← POST /api/save
│   ├── profile.js     ← POST /api/profile
│   ├── admin.js       ← GET/POST /api/admin
│   └── export.js      ← GET  /api/export  (VBA Excel)
└── public/
    ├── index.html
    └── logo.png       ← copier votre logo ici
```

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la base de données dans db.js
#    host / database / user / password

# 3. Démarrer le serveur
npm start              # production
npm run dev            # développement (nodemon)
```

## Accès
- **Application** : http://localhost:3000
- **Export VBA**  : http://localhost:3000/api/export

## URL VBA à mettre à jour
Dans `LPA_VBA.bas`, changer la constante :
```vba
Private Const EXPORT_URL As String = "http://localhost:3000/api/export"
```

## Base de données MySQL
Même schéma qu'avant (`lpa_db`). Aucun changement SQL nécessaire.

## Migrer les mots de passe
Si vos mots de passe sont encore en clair dans la BDD,
la migration vers bcrypt se fait **automatiquement** à la première
connexion de chaque utilisateur.
