// routes/save.js — Enregistrement d'un audit + envoi email pour NA
const express  = require('express');
const nodemailer = require('nodemailer');
const db       = require('../db');
const router   = express.Router();

// ── Transporter email ────────────────────────────────────────
// Configurer via variables d'environnement (Railway / .env)
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'chakir8822abdelhadi@gmail.com',
    pass: process.env.SMTP_PASS || 'iilxbavvsqgwwzjk',
  },
  tls: { rejectUnauthorized: false },
});

// POST /api/save
router.post('/', async (req, res) => {
  if (!req.session?.user) return res.json({ ok: false, err: 'Non connecté' });

  const u = req.session.user;
  const b = req.body ?? {};

  try {
    // ── Réponses ──────────────────────────────────────────────
    const rep = Array.isArray(b.reponses)
      ? JSON.stringify(b.reponses)
      : (typeof b.reponses === 'object'
          ? JSON.stringify(Object.values(b.reponses))
          : '[]');

    const O  = parseInt(b.conformes     ?? 0);
    const X  = parseInt(b.non_conformes ?? 0);
    const sc = (O + X) > 0 ? Math.round(O / (O + X) * 100) : 0;

    // ── Photos ────────────────────────────────────────────────
    const photos = (b.photos && typeof b.photos === 'object' && Object.keys(b.photos).length > 0)
      ? JSON.stringify(b.photos)
      : null;

    // ── Observations par question ─────────────────────────────
    const qObs = (b.q_observations && typeof b.q_observations === 'object' && Object.keys(b.q_observations).length > 0)
      ? JSON.stringify(b.q_observations)
      : null;

    // ── Assignés NA ──────────────────────────────────────────
    const naAssign = (b.na_assignees && typeof b.na_assignees === 'object' && Object.keys(b.na_assignees).length > 0)
      ? JSON.stringify(b.na_assignees)
      : null;

    const [result] = await db.execute(
      `INSERT INTO soumissions
        (date_audit, niveau, username, nom_auditeur, zone, shift, semaine, mois,
         reponses, observations, conformes, non_conformes, score, photos,
         q_observations, na_assignees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.date_audit ?? new Date().toISOString().split('T')[0],
        parseInt(b.niveau ?? u.niveau),
        u.username,
        u.nom,
        b.zone        ?? '',
        b.shift       ?? '',
        b.semaine     ?? '',
        b.mois        ?? '',
        rep,
        b.observations ?? '',
        O, X, sc,
        photos,
        qObs,
        naAssign,
      ]
    );

    const soumissionId = result.insertId;

    // ── Envoi email pour chaque NA assigné ───────────────────
    const emailResults = [];
    if (b.na_assignees && typeof b.na_assignees === 'object') {
      const photoObj = b.photos || {};
      const qObsObj  = b.q_observations || {};
      const niveau   = parseInt(b.niveau ?? u.niveau);

      for (const [qIdxStr, assigneeUsername] of Object.entries(b.na_assignees)) {
        if (!assigneeUsername) continue;
        const qIdx = parseInt(qIdxStr);

        try {
          // Récupérer email + nom de l'assigné
          const [[assignee]] = await db.execute(
            'SELECT nom, email, specialite FROM users WHERE username = ?',
            [assigneeUsername]
          );
          if (!assignee || !assignee.email) continue;

          // Texte de la question
          const QS_SERVER = require('../public/qs_data.json');
          const questionText = (QS_SERVER[niveau] || [])[qIdx] || `Question ${qIdx + 1}`;

          const obsText   = qObsObj[qIdxStr] || '—';
          const hasPhoto  = !!photoObj[qIdxStr];
          const photoData = photoObj[qIdxStr] || null;
          const fromName  = u.nom;
          const fromUser  = u.username;
          const zone      = b.zone || '—';
          const dateAudit = b.date_audit || new Date().toISOString().split('T')[0];

          const subject = `[LPA NA] Action requise — LPA${niveau} Q${qIdx + 1} — ${dateAudit}`;

          let htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;border-radius:12px">
  <div style="background:#0b1120;border-radius:10px;padding:18px 22px;margin-bottom:18px">
    <h2 style="color:#0ea5e9;margin:0;font-size:17px">⚠️ Point d'audit Non Applicable — Action requise</h2>
    <p style="color:#4e6a88;margin:6px 0 0;font-size:12px">LPA Hirschmann Automotive Oujda</p>
  </div>

  <div style="background:#fff;border-radius:10px;padding:16px 20px;margin-bottom:14px;border:1px solid #e2e8f0">
    <h3 style="color:#0b1120;margin:0 0 12px;font-size:14px">📋 Détails de l'audit</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse">
      <tr><td style="color:#64748b;padding:4px 0;width:130px">Auditeur</td><td style="font-weight:600">${fromName} (${fromUser})</td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Niveau</td><td style="font-weight:600">LPA ${niveau}</td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Zone</td><td>${zone}</td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Date audit</td><td>${dateAudit}</td></tr>
      <tr><td style="color:#64748b;padding:4px 0">Assigné à</td><td style="font-weight:600">${assignee.nom} (${assigneeUsername})</td></tr>
      ${assignee.specialite ? `<tr><td style="color:#64748b;padding:4px 0">Spécialité</td><td>${assignee.specialite}</td></tr>` : ''}
    </table>
  </div>

  <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:16px 20px;margin-bottom:14px">
    <h3 style="color:#92400e;margin:0 0 8px;font-size:14px">❓ Question ${qIdx + 1} — Réponse : <span style="background:#ffc107;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">NA</span></h3>
    <p style="color:#1e293b;font-size:13px;margin:0;line-height:1.5">${questionText}</p>
  </div>

  ${obsText !== '—' ? `
  <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:10px;padding:16px 20px;margin-bottom:14px">
    <h3 style="color:#166534;margin:0 0 8px;font-size:14px">📝 Observation de l'auditeur</h3>
    <p style="color:#1e293b;font-size:13px;margin:0;line-height:1.5">${obsText}</p>
  </div>` : ''}

  ${hasPhoto ? `
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:14px">
    <h3 style="color:#0b1120;margin:0 0 10px;font-size:14px">📷 Photo jointe</h3>
    <img src="cid:photo_q${qIdx}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0" alt="Photo Q${qIdx+1}">
  </div>` : ''}

  <p style="color:#94a3b8;font-size:11px;text-align:center;margin:16px 0 0">
    Cet email a été généré automatiquement par le système LPA — Hirschmann Automotive Oujda
  </p>
</div>`;

          const mailOptions = {
            from:    process.env.SMTP_FROM || process.env.SMTP_USER,
            to:      assignee.email,
            subject,
            html:    htmlBody,
            attachments: [],
          };

          // Attacher la photo si présente (base64 → inline attachment)
          if (hasPhoto && photoData) {
            const matches = photoData.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              mailOptions.attachments.push({
                filename: `photo_q${qIdx + 1}.jpg`,
                content:  Buffer.from(matches[2], 'base64'),
                contentType: matches[1],
                cid: `photo_q${qIdx}`,
              });
            }
          }

          await transporter.sendMail(mailOptions);

          // Logger l'envoi
          await db.execute(
            `INSERT INTO email_log (soumission_id, question_idx, from_username, to_username, to_email, subject, has_photo)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [soumissionId, qIdx, u.username, assigneeUsername, assignee.email, subject, hasPhoto ? 1 : 0]
          );

          emailResults.push({ qIdx, to: assignee.email, ok: true });
        } catch (emailErr) {
          emailResults.push({ qIdx, ok: false, err: emailErr.message });
        }
      }
    }

    res.json({ ok: true, id: soumissionId, score: sc, emails: emailResults });
  } catch (e) {
    res.json({ ok: false, err: e.message });
  }
});

module.exports = router;
