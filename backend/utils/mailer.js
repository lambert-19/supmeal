const nodemailer = require("nodemailer");
const { renderEmailLayout, button, linkFallback, TEXT_COLOR } = require("./email-templates");

let transporter;
let resendClient;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      // Certains hébergeurs (ex. Render) n'ont pas de sortie réseau IPv6 : sans
      // ça, Node résout smtp.gmail.com en IPv6 en premier et attend le timeout
      // complet (ENETUNREACH, ~2 min) avant d'abandonner cette tentative.
      family: 4,
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

// Beaucoup d'hébergeurs (Render inclus) voient leurs connexions SMTP
// sortantes vers Gmail bloquées ou expirer (restriction réseau côté hébergeur,
// ou anti-spam côté Google contre les plages d'IP de cloud) — Mailjet et
// Resend envoient par API HTTPS (jamais bloquée de la même façon) ; le SMTP
// direct reste le chemin par défaut en local (voir getTransporter) où ce
// blocage n'existe pas. Mailjet est essayé en premier : contrairement à
// Resend, il autorise l'envoi vers n'importe quel destinataire dès qu'un
// simple email expéditeur est vérifié (pas besoin de posséder un domaine).
function getResendClient() {
  if (resendClient) return resendClient;
  const { Resend } = require("resend");
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function parseFromHeader(from) {
  const match = from.match(/^(.*)<(.+)>$/);
  if (match) return { Name: match[1].trim().replace(/^"|"$/g, ""), Email: match[2].trim() };
  return { Email: from.trim() };
}

async function sendViaMailjet({ from, to, subject, html, text }) {
  const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`).toString("base64");
  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      Messages: [{ From: parseFromHeader(from), To: [{ Email: to }], Subject: subject, TextPart: text, HTMLPart: html }],
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.Messages?.[0]?.Status !== "success") {
    const errMsg = body?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || body?.ErrorMessage || res.statusText;
    throw new Error(`Échec de l'envoi de l'email (Mailjet) : ${errMsg}`);
  }
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || "SUPMEAL <no-reply@supmeal.fr>";

  if (process.env.MAILJET_API_KEY) {
    return sendViaMailjet({ from, to, subject, html, text });
  }

  if (process.env.RESEND_API_KEY) {
    const { error } = await getResendClient().emails.send({ from, to, subject, html, text });
    if (error) throw new Error(`Échec de l'envoi de l'email (Resend) : ${error.message}`);
    return;
  }

  await getTransporter().sendMail({ from, to, subject, html, text });

  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP non configuré — email simulé pour ${to} :\n${text}`);
  }
}

function sendVerificationEmail(to, token) {
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  const html = renderEmailLayout({
    title: "Vérifiez votre adresse email",
    preheader: "Confirmez votre adresse pour activer votre compte SUPMEAL.",
    bodyHtml: `
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${TEXT_COLOR};">Bienvenue sur SUPMEAL !</p>
      <p style="margin: 0 0 8px;">Merci de vous être inscrit·e. Il ne reste qu'une étape : confirmez votre adresse email pour activer votre compte.</p>
      ${button(link, "Vérifier mon adresse email")}
      <p style="margin: 0 0 16px; color: ${TEXT_COLOR};">Ce lien est valable <strong>24 heures</strong>.</p>
      ${linkFallback(link)}
    `,
    footerNote: "Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email en toute sécurité.",
  });
  return sendMail({
    to,
    subject: "Vérifiez votre adresse email — SUPMEAL",
    text: `Bienvenue sur SUPMEAL ! Vérifiez votre adresse email (lien valable 24h) : ${link}`,
    html,
  });
}

function sendPasswordResetEmail(to, token) {
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  const html = renderEmailLayout({
    title: "Réinitialisation de mot de passe",
    preheader: "Réinitialisez votre mot de passe SUPMEAL.",
    bodyHtml: `
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${TEXT_COLOR};">Réinitialisation de mot de passe</p>
      <p style="margin: 0 0 8px;">Vous avez demandé à réinitialiser votre mot de passe SUPMEAL.</p>
      ${button(link, "Choisir un nouveau mot de passe")}
      <p style="margin: 0 0 16px; color: ${TEXT_COLOR};">Ce lien est valable <strong>1 heure</strong>.</p>
      ${linkFallback(link)}
    `,
    footerNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe restera inchangé.",
  });
  return sendMail({
    to,
    subject: "Réinitialisation de mot de passe — SUPMEAL",
    text: `Réinitialisez votre mot de passe (lien valable 1h) : ${link}\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html,
  });
}

function sendCookbookInviteEmail(to, { token, cookbookName, existingAccount }) {
  if (existingAccount) {
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
    const html = renderEmailLayout({
      title: "Invitation à un cookbook",
      preheader: `Vous avez été invité·e à rejoindre "${cookbookName}" sur SUPMEAL.`,
      bodyHtml: `
        <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${TEXT_COLOR};">Vous avez été invité·e à un cookbook</p>
        <p style="margin: 0 0 8px;">Vous avez été invité·e à rejoindre le cookbook <strong>${cookbookName}</strong> sur SUPMEAL.</p>
        <p style="margin: 0 0 8px;">Votre compte existe déjà : connectez-vous pour y accéder directement.</p>
        ${button(link, "Me connecter")}
        ${linkFallback(link)}
      `,
    });
    return sendMail({
      to,
      subject: `Invitation au cookbook "${cookbookName}" — SUPMEAL`,
      text: `Vous avez été invité à rejoindre le cookbook "${cookbookName}" sur SUPMEAL. Connectez-vous pour y accéder : ${link}`,
      html,
    });
  }

  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?inviteToken=${token}`;
  const html = renderEmailLayout({
    title: "Invitation à un cookbook",
    preheader: `Vous avez été invité·e à rejoindre "${cookbookName}" sur SUPMEAL.`,
    bodyHtml: `
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${TEXT_COLOR};">Vous avez été invité·e à un cookbook</p>
      <p style="margin: 0 0 8px;">Vous avez été invité·e à rejoindre le cookbook <strong>${cookbookName}</strong> sur SUPMEAL.</p>
      <p style="margin: 0 0 8px;">Créez votre compte pour accepter l'invitation.</p>
      ${button(link, "Créer mon compte")}
      <p style="margin: 0 0 16px; color: ${TEXT_COLOR};">Ce lien est valable <strong>7 jours</strong>.</p>
      ${linkFallback(link)}
    `,
  });
  return sendMail({
    to,
    subject: `Invitation au cookbook "${cookbookName}" — SUPMEAL`,
    text: `Vous avez été invité à rejoindre le cookbook "${cookbookName}" sur SUPMEAL. Créez votre compte pour l'accepter (lien valable 7 jours) : ${link}`,
    html,
  });
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, sendCookbookInviteEmail };
