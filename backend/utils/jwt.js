const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "supmeal_csrf";

function signToken(userId, tokenVersion = 0) {
  return jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

// Cookie CSRF (pattern double-submit) : nécessaire car sameSite="none" en
// production (frontend/backend sur des origines différentes) désactive la
// protection CSRF native qu'offrirait sameSite="lax"/"strict". Contrairement
// au cookie de session, il doit être lisible en JS (httpOnly: false) pour que
// le frontend puisse le recopier dans un en-tête (voir middleware/csrf.js).
function csrfCookieOptions() {
  return { ...cookieOptions(), httpOnly: false };
}

function generateCsrfToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = { signToken, verifyToken, cookieOptions, csrfCookieOptions, generateCsrfToken, CSRF_COOKIE_NAME };
