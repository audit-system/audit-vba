// routes/save.js — Enregistrement d'un audit + envoi email NA traduit
const express        = require('express');
const nodemailer     = require('nodemailer');
const db             = require('../db');
const { t, getLang } = require('../i18n');
const router         = express.Router();

// ── Questions par niveau (pour le corps de l'email) ─────────
const QS = {
  fr: {
    1: ["Est-ce que le Layered-Audit 1er niveau est assuré ? Efficace ?","Les documents de démarrage (production, qualité, process, lean, HSE, maintenance) sont disponibles et remplis conformément aux standards ?","Le processus établi dans la ligne est compatible au plan de travail ? (opérations et équipement)","L'affectation des opérateurs est conforme par rapport aux matrices de compétences ?","Les paramètres de sécurité process/machines sont activés & vérifiés ?","Est-ce que la maintenance préventive se fait systématiquement ?","Les équipements / outils sont calibrés ?","Les OPL's qualité, analyse top défaut ou défaut critique sont faits systématiquement et effectivement ?","Les produits bloqués à la cage rouge sont analysés par l'équipe ?","Les exigences générales concernant la sécurité, santé et protection d'environnement sont documentées et respectées ?","La séparation des déchets est bien respectée d'une manière systématique ?","Les racks de matière première sont identifiés et conformes à la matrice définie par la logistique/process ?","Chaque chose est dans sa place, et une place pour chaque chose ? (Couloir, zone vide, rack équipement/outils…)","Des actions correctives sont-elles mises en place suite aux analyses de réclamations client récurrentes ?","Vérifier le nettoyage de la matière première dans la ligne (ex: sac PE est fermé…) ?","Vérifier le nettoyage des box / blisters from WH ?","Vérifier le nettoyage de l'équipement conformément à la forme FO-2022 ?"],
    2: ["Est-ce que la réunion journalière du segment leader avec l'équipe est réalisée ?","La réunion journalière du shift leader est faite ?","Le système layered audit du shift leader est réalisé ?","Est-ce que le système layered audit du segment leader est respecté ?","Respectez-vous le système du \"Kanban\" ?","Le système d'OPL est respecté ?","Le Q-Point est à jour ?","Y a-t-il des améliorations pour le segment ?","Le traitement des réclamations clients est assuré ?","Le système de gestion documentaire est respecté ?","Existe-t-il une gestion pour les MAP ? Est-ce qu'elle est respectée ?","La gestion des incomplets est respectée ?","Le système H&S est respecté ?","Le système d'environnement au sein du segment est connu et respecté ?"],
    3: ["Est-ce que la passation Op coordinateur et Op adjuster est faite correctement ?","Les documents de démarrage (4/6 Eyes, FSK, OK démarrage, fiche maintenance, dummy test, suivi de production) sont rempliés & signés pour J-1 ?","Flux de produits respecte le plan de travail ?","L'affectation des opérateurs est conforme par rapport aux matrices de compétences, mis à jour badge ?","Les paramètres de sécurité process/machines sont activés & vérifiés ?","Les étiquettes de la maintenance préventive sont collées sur les machines/équipements, avec date à jour ?","Tous les équipements / outils / dispositifs sont calibrés ?","Les OPLs qualité et analyse 1er niveau des défauts qualité bloquées à la cage rouge sont analysées avec actions ?","Vérifier la séparation des déchets (carton, plastique, produits chimiques…) ?","Respect des EPIs ? Identifier tous risques incidents/accidents/santé et sécurité au travail ?","Les racks de matière première sont identifiés et conformes à la matrice définie par la logistique/process ?","Chaque chose est dans sa place, et une place pour chaque chose ? (Couloir, zone vide, rack équipement/outils…)","Les Shift Leaders font-ils un suivi des actions/solutions apportées conforme aux attentes client ?","5S opérateurs"],
  },
  en: {
    1: ["Is the 1st level Layered-Audit ensured? Effective?","Are start-up documents (production, quality, process, lean, HSE, maintenance) available and filled in accordance with standards?","Is the established process on the line compatible with the work plan? (operations and equipment)","Is operator assignment compliant with skills matrices?","Are process/machine safety parameters activated & verified?","Is preventive maintenance carried out systematically?","Are equipment / tools calibrated?","Are quality OPLs, top defect or critical defect analyses carried out systematically and effectively?","Are items blocked in the red cage analysed by the team?","Are general safety, health and environmental requirements documented and respected?","Is waste separation respected systematically?","Are raw material racks identified and compliant with the matrix defined by logistics/process?","A place for everything and everything in its place? (Aisle, empty zone, equipment/tools rack…)","Are corrective actions implemented following recurring customer complaint analyses?","Verify cleanliness of raw material on the line (e.g. PE bag is closed…)?","Verify cleanliness of boxes / blisters from WH?","Verify equipment cleanliness in accordance with form FO-2022?"],
    2: ["Is the daily segment leader meeting with the team held?","Is the daily shift leader meeting held?","Is the shift leader layered audit system in place?","Is the segment leader layered audit system respected?","Do you follow the Kanban system?","Is the OPL system respected?","Is the Q-Point up to date?","Are there improvements for the segment?","Is customer complaint handling ensured?","Is the document management system respected?","Is there a MAP management system? Is it respected?","Is incomplete item management respected?","Is the H&S system respected?","Is the environmental system within the segment known and respected?"],
    3: ["Is the handover between Op coordinator and Op adjuster done correctly?","Are start-up documents (4/6 Eyes, FSK, OK start, maintenance sheet, dummy test, production tracking) filled & signed for D-1?","Does the product flow respect the work plan?","Is operator assignment compliant with skills matrices, badge updated?","Are process/machine safety parameters activated & verified?","Are preventive maintenance labels affixed to machines/equipment, with current date?","Are all equipment / tools / devices calibrated?","Are quality OPLs and first-level defect analysis of items blocked in the red cage analysed with actions?","Verify waste separation (cardboard, plastic, chemicals…)?","Respect PPE? Identify all incident/accident/occupational health and safety risks?","Are raw material racks identified and compliant with the matrix defined by logistics/process?","A place for everything and everything in its place? (Aisle, empty zone, equipment/tools rack…)","Are Shift Leaders monitoring actions/solutions in line with customer expectations?","5S operators"],
  },
  de: {
    1: ["Wird das Layered-Audit der 1. Ebene sichergestellt? Effektiv?","Sind Anlaufdokumente (Produktion, Qualität, Prozess, Lean, HSE, Wartung) verfügbar und gemäß Standards ausgefüllt?","Ist der etablierte Prozess auf der Linie mit dem Arbeitsplan kompatibel? (Operationen und Ausrüstung)","Entspricht die Bedienerzuordnung den Kompetenzmatrizen?","Sind Prozess-/Maschinensicherheitsparameter aktiviert & überprüft?","Wird die vorbeugende Wartung systematisch durchgeführt?","Sind Geräte / Werkzeuge kalibriert?","Werden Qualitäts-OPLs, Top-Defekt- oder kritische Defektanalysen systematisch und effektiv durchgeführt?","Werden in der roten Käfig blockierte Produkte vom Team analysiert?","Sind allgemeine Sicherheits-, Gesundheits- und Umweltanforderungen dokumentiert und eingehalten?","Wird die Abfalltrennung systematisch eingehalten?","Sind Rohstoffregale entsprechend der Matrix von Logistik/Prozess gekennzeichnet und konform?","Jeder Gegenstand an seinem Platz, ein Platz für jeden Gegenstand? (Gang, leere Zone, Geräte-/Werkzeugregale…)","Werden Korrekturmaßnahmen nach wiederkehrenden Kundenreklamationsanalysen umgesetzt?","Sauberkeit des Rohstoffs auf der Linie überprüfen (z.B. PE-Beutel geschlossen…)?","Sauberkeit der Boxen / Blister aus dem Lager überprüfen?","Gerätesauberkeit gemäß Formblatt FO-2022 überprüfen?"],
    2: ["Findet das tägliche Meeting des Segment Leaders mit dem Team statt?","Findet das tägliche Meeting des Shift Leaders statt?","Wird das Layered-Audit-System des Shift Leaders durchgeführt?","Wird das Layered-Audit-System des Segment Leaders eingehalten?","Wird das Kanban-System eingehalten?","Wird das OPL-System eingehalten?","Ist der Q-Point aktuell?","Gibt es Verbesserungen für das Segment?","Ist die Bearbeitung von Kundenreklamationen sichergestellt?","Wird das Dokumentenmanagementsystem eingehalten?","Gibt es ein MAP-Managementsystem? Wird es eingehalten?","Wird das Management unvollständiger Teile eingehalten?","Wird das H&S-System eingehalten?","Ist das Umweltsystem im Segment bekannt und eingehalten?"],
    3: ["Wird die Übergabe zwischen Op-Koordinator und Op-Adjuster korrekt durchgeführt?","Sind Anlaufdokumente (4/6 Eyes, FSK, OK-Start, Wartungsblatt, Dummy-Test, Produktionsverfolgung) für J-1 ausgefüllt & unterschrieben?","Entspricht der Produktfluss dem Arbeitsplan?","Entspricht die Bedienerzuordnung den Kompetenzmatrizen, Badge aktualisiert?","Sind Prozess-/Maschinensicherheitsparameter aktiviert & überprüft?","Sind Aufkleber für vorbeugende Wartung an Maschinen/Geräten angebracht, mit aktuellem Datum?","Sind alle Geräte / Werkzeuge / Vorrichtungen kalibriert?","Werden Qualitäts-OPLs und Erstanalyse von in der roten Käfig blockierten Qualitätsmängeln mit Maßnahmen analysiert?","Abfalltrennung überprüfen (Karton, Kunststoff, Chemikalien…)?","PSA einhalten? Alle Unfall-/Gesundheits- und Sicherheitsrisiken identifizieren?","Sind Rohstoffregale entsprechend der von Logistik/Prozess definierten Matrix gekennzeichnet und konform?","Jeder Gegenstand an seinem Platz, ein Platz für jeden Gegenstand? (Gang, leere Zone, Geräte-/Werkzeugregale…)","Überwachen Shift Leader Maßnahmen/Lösungen gemäß Kundenanforderungen?","5S Bediener"],
  },
};

// ── Email transporter ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'chakir8822abdelhadi@gmail.com',
    pass: process.env.SMTP_PASS || 'iilxbavvsqgwwzjk',
  },
  tls: { rejectUnauthorized: false },
});

// ── Build translated HTML email ──────────────────────────────
function buildEmailHtml(lang, { fromName, fromUser, niveau, zone, dateAudit,
  questionText, qIdx, obsText, hasPhoto, photoData, assignee }) {

  const subject = t(lang, 'email.subject', {
    lv: niveau, q: qIdx + 1, date: dateAudit,
  });

  const rows = [
    [t(lang, 'email.field.auditor'),   `${fromName} (${fromUser})`],
    [t(lang, 'email.field.level'),     `LPA ${niveau}`],
    [t(lang, 'email.field.zone'),      zone || '—'],
    [t(lang, 'email.field.date'),      dateAudit],
    [t(lang, 'email.field.assigned'),  `${assignee.nom} (${assignee.username})`],
    ...(assignee.specialite ? [[t(lang, 'email.field.specialite'), assignee.specialite]] : []),
  ].map(([lbl, val]) =>
    `<tr><td style="color:#64748b;padding:4px 0;width:140px">${lbl}</td>
         <td style="font-weight:600">${val}</td></tr>`
  ).join('');

  const qLabel    = t(lang, 'email.question_label', { n: qIdx + 1 });
  const naBadge   = `<span style="background:#ffc107;color:#fff;padding:2px 9px;border-radius:4px;font-size:12px;font-weight:700">${t(lang, 'email.na_badge')}</span>`;
  const obsBlock  = obsText ? `
    <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:10px;padding:16px 20px;margin-bottom:14px">
      <h3 style="color:#166534;margin:0 0 8px;font-size:14px">📝 ${t(lang, 'email.observation_title')}</h3>
      <p style="color:#1e293b;font-size:13px;margin:0;line-height:1.5">${obsText}</p>
    </div>` : '';
  const photoBlock = hasPhoto ? `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:14px">
      <h3 style="color:#0b1120;margin:0 0 10px;font-size:14px">📷 ${t(lang, 'email.photo_title')}</h3>
      <img src="cid:photo_q${qIdx}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0">
    </div>` : '';

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;border-radius:12px">
  <div style="background:#0b1120;border-radius:10px;padding:18px 22px;margin-bottom:18px">
    <h2 style="color:#0ea5e9;margin:0;font-size:17px">${t(lang, 'email.title')}</h2>
    <p style="color:#4e6a88;margin:6px 0 0;font-size:12px">${t(lang, 'email.subtitle')}</p>
  </div>
  <div style="background:#fff;border-radius:10px;padding:16px 20px;margin-bottom:14px;border:1px solid #e2e8f0">
    <h3 style="color:#0b1120;margin:0 0 12px;font-size:14px">📋 ${t(lang, 'email.audit_details')}</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse">${rows}</table>
  </div>
  <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:16px 20px;margin-bottom:14px">
    <h3 style="color:#92400e;margin:0 0 8px;font-size:14px">${qLabel} ${naBadge}</h3>
    <p style="color:#1e293b;font-size:13px;margin:0;line-height:1.5">${questionText}</p>
  </div>
  ${obsBlock}
  ${photoBlock}
  <p style="color:#94a3b8;font-size:11px;text-align:center;margin:16px 0 0">${t(lang, 'email.footer')}</p>
</div>`;

  return { subject, html };
}

// POST /api/save
router.post('/', async (req, res) => {
  if (!req.session?.user)
    return res.json({ ok: false, err: t(getLang(req), 'err.not_connected') });

  const lang = getLang(req);
  const u    = req.session.user;
  const b    = req.body ?? {};

  try {
    // ── Responses ────────────────────────────────────────────
    const rep = Array.isArray(b.reponses)
      ? JSON.stringify(b.reponses)
      : (typeof b.reponses === 'object'
          ? JSON.stringify(Object.values(b.reponses))
          : '[]');

    const O  = parseInt(b.conformes     ?? 0);
    const X  = parseInt(b.non_conformes ?? 0);
    const sc = (O + X) > 0 ? Math.round(O / (O + X) * 100) : 0;

    // ── Photos ───────────────────────────────────────────────
    const photos = (b.photos && typeof b.photos === 'object' && Object.keys(b.photos).length > 0)
      ? JSON.stringify(b.photos) : null;

    // ── General per-question comments (all questions, mandatory for NA) ─
    const qCmt = (b.q_comments && typeof b.q_comments === 'object' && Object.keys(b.q_comments).length > 0)
      ? JSON.stringify(b.q_comments) : null;

    // ── NA assignees ─────────────────────────────────────────
    const naAssign = (b.na_assignees && typeof b.na_assignees === 'object' && Object.keys(b.na_assignees).length > 0)
      ? JSON.stringify(b.na_assignees) : null;

    const [result] = await db.execute(
      `INSERT INTO soumissions
        (date_audit, niveau, username, nom_auditeur, zone, shift, semaine, mois,
         reponses, observations, conformes, non_conformes, score, photos,
         q_comments, na_assignees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.date_audit ?? new Date().toISOString().split('T')[0],
        parseInt(b.niveau ?? u.niveau),
        u.username,
        u.nom,
        b.zone         ?? '',
        b.shift        ?? '',
        b.semaine      ?? '',
        b.mois         ?? '',
        rep,
        b.observations ?? '',
        O, X, sc,
        photos,
        qCmt,
        naAssign,
      ]
    );

    const soumissionId = result.insertId;

    // ── Send emails for each NA with an assignee ─────────────
    const emailResults = [];
    if (b.na_assignees && typeof b.na_assignees === 'object') {
      const photoObj  = b.photos     || {};
      const qCmtObj   = b.q_comments || {};   // comments serve as both general notes and NA justification
      const niveau   = parseInt(b.niveau ?? u.niveau);

      for (const [qIdxStr, assigneeUsername] of Object.entries(b.na_assignees)) {
        if (!assigneeUsername) continue;
        const qIdx = parseInt(qIdxStr);

        try {
          const [[assignee]] = await db.execute(
            'SELECT nom, email, specialite, username FROM users WHERE username = ?',
            [assigneeUsername]
          );
          if (!assignee?.email) continue;

          // Question text in the user's language
          const questionText = (QS[lang]?.[niveau] || QS.fr[niveau] || [])[qIdx]
            || `Q${qIdx + 1}`;

          const obsText  = qCmtObj[qIdxStr]  || qCmtObj[qIdx]  || '';
          const hasPhoto = !!(photoObj[qIdxStr] || photoObj[qIdx]);
          const photoData = photoObj[qIdxStr] || photoObj[qIdx] || null;

          const { subject, html } = buildEmailHtml(lang, {
            fromName: u.nom, fromUser: u.username,
            niveau, zone: b.zone || '—',
            dateAudit: b.date_audit || new Date().toISOString().split('T')[0],
            questionText, qIdx, obsText, hasPhoto, photoData, assignee,
          });

          const mailOptions = {
            from:        process.env.SMTP_FROM || process.env.SMTP_USER,
            to:          assignee.email,
            subject,
            html,
            attachments: [],
          };

          // Attach photo as inline CID if present
          if (hasPhoto && photoData) {
            const m = photoData.match(/^data:(.+);base64,(.+)$/);
            if (m) {
              mailOptions.attachments.push({
                filename:    `photo_q${qIdx + 1}.jpg`,
                content:     Buffer.from(m[2], 'base64'),
                contentType: m[1],
                cid:         `photo_q${qIdx}`,
              });
            }
          }

          await transporter.sendMail(mailOptions);
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
