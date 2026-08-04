const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    // Pas de SMTP configuré (dev sans compte mail réel) : les emails ne partent
    // pas, mais on garde un transport nodemailer valide et on logge le lien en console.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || "SUPMEAL <no-reply@supmeal.fr>";
  await getTransporter().sendMail({ from, to, subject, html, text });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — email simulé pour ${to} :\n${text}`);
  }
}

function sendVerificationEmail(to, token) {
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  return sendMail({
    to,
    subject: "Vérifiez votre adresse email — SUPMEAL",
    text: `Bienvenue sur SUPMEAL ! Vérifiez votre adresse email (lien valable 24h) : ${link}`,
    html: `<p>Bienvenue sur SUPMEAL !</p><p><a href="${link}">Vérifiez votre adresse email</a> (lien valable 24h).</p>`,
  });
}

function sendPasswordResetEmail(to, token) {
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: "Réinitialisation de mot de passe — SUPMEAL",
    text: `Réinitialisez votre mot de passe (lien valable 1h) : ${link}\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html: `<p><a href="${link}">Réinitialisez votre mot de passe</a> (lien valable 1h).</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  });
}

function sendCookbookInviteEmail(to, { token, cookbookName, existingAccount }) {
  if (existingAccount) {
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    return sendMail({
      to,
      subject: `Invitation au cookbook "${cookbookName}" — SUPMEAL`,
      text: `Vous avez été invité à rejoindre le cookbook "${cookbookName}" sur SUPMEAL. Connectez-vous pour y accéder : ${link}`,
      html: `<p>Vous avez été invité à rejoindre le cookbook <strong>${cookbookName}</strong> sur SUPMEAL.</p><p><a href="${link}">Connectez-vous</a> pour y accéder.</p>`,
    });
  }

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?inviteToken=${token}`;
  return sendMail({
    to,
    subject: `Invitation au cookbook "${cookbookName}" — SUPMEAL`,
    text: `Vous avez été invité à rejoindre le cookbook "${cookbookName}" sur SUPMEAL. Créez votre compte pour l'accepter (lien valable 7 jours) : ${link}`,
    html: `<p>Vous avez été invité à rejoindre le cookbook <strong>${cookbookName}</strong> sur SUPMEAL.</p><p><a href="${link}">Créez votre compte</a> pour l'accepter (lien valable 7 jours).</p>`,
  });
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, sendCookbookInviteEmail };
