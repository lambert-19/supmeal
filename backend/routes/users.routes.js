const { Router } = require("express");
const { body } = require("express-validator");

const usersController = require("../controllers/users.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

router.patch(
  "/me",
  [body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères.")],
  validate,
  usersController.updateProfile
);

router.patch(
  "/me/password",
  [
    body("currentPassword").notEmpty().withMessage("Le mot de passe actuel est requis."),
    body("newPassword").isLength({ min: 8 }).withMessage("8 caractères minimum."),
  ],
  validate,
  usersController.changePassword
);

router.patch(
  "/me/preferences",
  [
    body("dietaryRegime").isString(),
    body("allergies").isArray(),
    body("favoriteCuisine").isString(),
    body("defaultServings").isInt({ min: 1, max: 20 }).withMessage("Entre 1 et 20 portions."),
  ],
  validate,
  usersController.updatePreferences
);

module.exports = router;
