const { Router } = require("express");
const { body } = require("express-validator");

const usersController = require("../controllers/users.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Modifier le profil (nom)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties: { name: { type: string, minLength: 2 } }
 *     responses:
 *       200:
 *         description: Profil mis à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch(
  "/me",
  [body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères.")],
  validate,
  usersController.updateProfile
);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Changer le mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe changé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch(
  "/me/password",
  [
    body("currentPassword").notEmpty().withMessage("Le mot de passe actuel est requis."),
    body("newPassword").isLength({ min: 8 }).withMessage("8 caractères minimum."),
  ],
  validate,
  usersController.changePassword
);

/**
 * @swagger
 * /users/me/preferences:
 *   patch:
 *     tags: [Users]
 *     summary: Modifier les préférences alimentaires
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dietaryRegime, allergies, favoriteCuisine, defaultServings]
 *             properties:
 *               dietaryRegime: { type: string }
 *               allergies: { type: array, items: { type: string } }
 *               favoriteCuisine: { type: string }
 *               defaultServings: { type: integer, minimum: 1, maximum: 20 }
 *     responses:
 *       200:
 *         description: Préférences mises à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
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
