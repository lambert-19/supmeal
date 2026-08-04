const { Router } = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { loginLimiter, authActionLimiter } = require("../middleware/rateLimit");
const { PASSWORD_RULES, PASSWORD_MESSAGE } = require("../utils/passwordPolicy");

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Créer un compte
 *     description: >
 *       Crée le compte et envoie un email de vérification (token valide 24h).
 *       La connexion est refusée tant que l'email n'est pas vérifié.
 *       Si `inviteToken` correspond à une invitation de cookbook en attente,
 *       le compte y est automatiquement rattaché après création.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               inviteToken: { type: string, description: "Token reçu par email d'invitation à un cookbook (optionnel)" }
 *     responses:
 *       201:
 *         description: Compte créé.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409:
 *         description: Un compte existe déjà avec cet email.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.post(
  "/register",
  authActionLimiter,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères."),
    body("email").trim().isEmail().withMessage("Adresse email invalide."),
    body("password").isStrongPassword(PASSWORD_RULES).withMessage(PASSWORD_MESSAGE),
    body("inviteToken").optional().isString(),
  ],
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Se connecter
 *     description: Pose le cookie httpOnly d'authentification. Refusé si l'email n'est pas vérifié.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connecté.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401:
 *         description: Identifiants invalides ou email non vérifié.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router.post(
  "/login",
  loginLimiter,
  [
    body("email").trim().isEmail().withMessage("Adresse email invalide."),
    body("password").notEmpty().withMessage("Le mot de passe est requis."),
  ],
  validate,
  authController.login
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Se déconnecter
 *     description: Efface le cookie d'authentification.
 *     security: []
 *     responses:
 *       204: { description: Déconnecté. }
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Profil de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Profil courant.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", requireAuth, authController.me);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Vérifier l'adresse email
 *     description: Consomme le token reçu par email (valide 24h, usage unique).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties: { token: { type: string } }
 *     responses:
 *       200:
 *         description: Email vérifié.
 *         content: { application/json: { schema: { type: object, properties: { message: { type: string } } } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  "/verify-email",
  [body("token").isString().notEmpty().withMessage("Token requis.")],
  validate,
  authController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Renvoyer l'email de vérification
 *     description: Réponse volontairement identique que le compte existe ou non, pour ne pas révéler les emails inscrits.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties: { email: { type: string, format: email } }
 *     responses:
 *       200:
 *         description: Email renvoyé si le compte existe et n'est pas déjà vérifié.
 *         content: { application/json: { schema: { type: object, properties: { message: { type: string } } } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  "/resend-verification",
  authActionLimiter,
  [body("email").trim().isEmail().withMessage("Adresse email invalide.")],
  validate,
  authController.resendVerification
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demander une réinitialisation de mot de passe
 *     description: Réponse volontairement identique que le compte existe ou non. Token valide 1h, usage unique.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties: { email: { type: string, format: email } }
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé si le compte existe.
 *         content: { application/json: { schema: { type: object, properties: { message: { type: string } } } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  "/forgot-password",
  authActionLimiter,
  [body("email").trim().isEmail().withMessage("Adresse email invalide.")],
  validate,
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Réinitialiser le mot de passe
 *     description: Consomme le token reçu par email (valide 1h, usage unique).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé.
 *         content: { application/json: { schema: { type: object, properties: { message: { type: string } } } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  "/reset-password",
  authActionLimiter,
  [
    body("token").isString().notEmpty().withMessage("Token requis."),
    body("newPassword").isStrongPassword(PASSWORD_RULES).withMessage(PASSWORD_MESSAGE),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
