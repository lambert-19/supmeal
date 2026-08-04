const { Router } = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères."),
    body("email").trim().isEmail().withMessage("Adresse email invalide."),
    body("password").isLength({ min: 8 }).withMessage("8 caractères minimum."),
    body("inviteToken").optional().isString(),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Adresse email invalide."),
    body("password").notEmpty().withMessage("Le mot de passe est requis."),
  ],
  validate,
  authController.login
);

router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

router.post(
  "/verify-email",
  [body("token").isString().notEmpty().withMessage("Token requis.")],
  validate,
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  [body("email").trim().isEmail().withMessage("Adresse email invalide.")],
  validate,
  authController.resendVerification
);

router.post(
  "/forgot-password",
  [body("email").trim().isEmail().withMessage("Adresse email invalide.")],
  validate,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").isString().notEmpty().withMessage("Token requis."),
    body("newPassword").isLength({ min: 8 }).withMessage("8 caractères minimum."),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
