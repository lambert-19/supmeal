const crypto = require("crypto");

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const COOKBOOK_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateToken(ttlMs) {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + ttlMs) };
}

module.exports = {
  hashToken,
  generateToken,
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  COOKBOOK_INVITE_TTL_MS,
};
