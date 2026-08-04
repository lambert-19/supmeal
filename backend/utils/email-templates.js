const BRAND_COLOR = "#c65029";
const BRAND_COLOR_DARK = "#a83f1f";
const TEXT_COLOR = "#2b241f";
const MUTED_COLOR = "#8a7f76";
const BORDER_COLOR = "#ece3da";
const BG_COLOR = "#f6efe7";

function button(url, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td align="center" bgcolor="${BRAND_COLOR}" style="border-radius: 8px;">
          <a href="${url}" target="_blank"
            style="display: inline-block; padding: 13px 28px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function renderEmailLayout({ preheader = "", title, bodyHtml, footerNote = "" }) {
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BG_COLOR}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid ${BORDER_COLOR}; border-radius: 12px; overflow: hidden;">
            <tr>
              <td align="center" bgcolor="${BRAND_COLOR}" style="background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK}); padding: 28px 24px;">
                <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">
                  SUPMEAL
                </span>
                <div style="font-size: 12px; color: #f6e3d8; margin-top: 4px;">Recettes &amp; organisation des repas</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 32px 28px; color: ${TEXT_COLOR}; font-size: 15px; line-height: 1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color: ${BG_COLOR}; border-top: 1px solid ${BORDER_COLOR}; color: ${MUTED_COLOR}; font-size: 12px; line-height: 1.6;">
                ${footerNote ? `<p style="margin: 0 0 8px;">${footerNote}</p>` : ""}
                <p style="margin: 0;">© ${new Date().getFullYear()} SUPMEAL — projet étudiant. Vous recevez cet email suite à une action effectuée sur supmeal.fr.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function linkFallback(url) {
  return `<p style="margin: 0; font-size: 12px; color: ${MUTED_COLOR}; word-break: break-all;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br /><a href="${url}" style="color: ${BRAND_COLOR};">${url}</a></p>`;
}

module.exports = { renderEmailLayout, button, linkFallback, BRAND_COLOR, TEXT_COLOR, MUTED_COLOR };
