const authService = require("../services/auth.service");
const { signToken, cookieOptions, csrfCookieOptions, generateCsrfToken, CSRF_COOKIE_NAME } = require("../utils/jwt");
const { toSafeUser } = require("../utils/serializers");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  await authService.register(req.body);
  res.status(201).json({ message: "Compte créé. Vérifiez votre boîte mail pour activer votre compte." });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = signToken(user.id, user.tokenVersion);
  const csrfToken = generateCsrfToken();
  res.cookie(process.env.COOKIE_NAME, token, cookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
  res.set("X-CSRF-Token", csrfToken);
  res.json(toSafeUser(user));
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.clearCookie(CSRF_COOKIE_NAME, { ...csrfCookieOptions(), maxAge: undefined });
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user.id);
  // Migration en douceur : une session déjà active avant l'ajout du CSRF
  // n'a pas encore ce cookie — on le pose ici plutôt que de forcer une
  // reconnexion. Renvoyé aussi en en-tête à chaque appel (pas seulement à la
  // création) : c'est le seul moyen pour un frontend sur une autre origine
  // (ex. Vercel vs Render) de récupérer la valeur, un cookie posé par ce
  // domaine n'étant pas lisible en JS depuis un autre domaine.
  let csrfToken = req.cookies[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
  }
  res.set("X-CSRF-Token", csrfToken);
  res.json(toSafeUser(user));
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);
  res.json({ message: "Adresse email vérifiée. Vous pouvez maintenant vous connecter." });
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  res.json({ message: "Si un compte non vérifié existe avec cet email, un lien a été envoyé." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ message: "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter." });
});

module.exports = {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
