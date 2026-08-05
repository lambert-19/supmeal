const crypto = require("crypto");

// Cookie temporaire (10 min) qui porte l'état d'une danse OAuth2 en cours :
// le `state` anti-CSRF, l'intention ("login" crée/connecte un compte, "link"
// rattache le fournisseur à l'utilisateur déjà connecté) et, pour "link",
// l'id de l'utilisateur courant (lu depuis le cookie de session au moment du
// départ, puisqu'on ne peut pas compter sur req.user après l'aller-retour
// chez le fournisseur tiers). Signé par rien de plus que sa valeur exacte :
// un attaquant qui altère ce cookie ne peut que casser la comparaison de
// `state`, jamais la forger avec succès.
const OAUTH_FLOW_COOKIE = "supmeal_oauth_flow";
const OAUTH_FLOW_MAX_AGE_MS = 10 * 60 * 1000;

function oauthFlowCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: OAUTH_FLOW_MAX_AGE_MS,
    path: "/",
  };
}

function generateState() {
  return crypto.randomBytes(24).toString("hex");
}

function readOAuthFlow(req) {
  const raw = req.cookies[OAUTH_FLOW_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { OAUTH_FLOW_COOKIE, oauthFlowCookieOptions, generateState, readOAuthFlow };
