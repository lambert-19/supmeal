const { Router } = require("express");
const { body } = require("express-validator");

const cookbooksController = require("../controllers/cookbooks.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");
const loadCookbookAndRole = require("../middleware/loadCookbook");

const router = Router();

router.use(requireAuth);
router.use(csrfProtection);

const cookbookValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères."),
];

const inviteValidation = [
  body("email").trim().isEmail().withMessage("Email invalide."),
  body("role").isIn(["editor", "commentator", "reader"]).withMessage("Choisissez un rôle."),
];

/**
 * @swagger
 * /cookbooks:
 *   get:
 *     tags: [Cookbooks]
 *     summary: Lister mes cookbooks
 *     description: Cookbooks possédés ou dont l'utilisateur connecté est membre.
 *     responses:
 *       200:
 *         description: Liste des cookbooks.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Cookbook' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Cookbooks]
 *     summary: Créer un cookbook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties: { name: { type: string, minLength: 2 } }
 *     responses:
 *       201:
 *         description: Cookbook créé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Cookbook' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", cookbooksController.list);
router.post("/", cookbookValidation, validate, cookbooksController.create);

/**
 * @swagger
 * /cookbooks/{id}:
 *   get:
 *     tags: [Cookbooks]
 *     summary: Détail d'un cookbook
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cookbook (avec le rôle de l'utilisateur connecté).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Cookbook'
 *                 - type: object
 *                   properties: { role: { type: string, enum: [owner, editor, commentator, reader] } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Cookbooks]
 *     summary: Renommer un cookbook
 *     description: Réservé au créateur (rôle `owner`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *         description: Cookbook mis à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Cookbook' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cookbooks]
 *     summary: Supprimer un cookbook
 *     description: Réservé au créateur (rôle `owner`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Cookbook supprimé. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", loadCookbookAndRole, cookbooksController.getOne);
router.patch("/:id", loadCookbookAndRole, cookbookValidation, validate, cookbooksController.update);
router.delete("/:id", loadCookbookAndRole, cookbooksController.remove);

/**
 * @swagger
 * /cookbooks/{id}/recipes:
 *   get:
 *     tags: [Cookbooks]
 *     summary: Lister les recettes rattachées au cookbook
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recettes du cookbook.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Recipe' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id/recipes", loadCookbookAndRole, cookbooksController.listRecipes);

/**
 * @swagger
 * /cookbooks/{id}/recipes/{recipeId}:
 *   post:
 *     tags: [Cookbooks]
 *     summary: Rattacher une de mes recettes au cookbook
 *     description: Réservé au propriétaire de la recette, avec un rôle `editor` ou `owner` sur le cookbook.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recette rattachée.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cookbooks]
 *     summary: Détacher une recette du cookbook
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recette détachée.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/recipes/:recipeId", loadCookbookAndRole, cookbooksController.attachRecipe);
router.delete("/:id/recipes/:recipeId", loadCookbookAndRole, cookbooksController.detachRecipe);

/**
 * @swagger
 * /cookbooks/{id}/members:
 *   post:
 *     tags: [Cookbooks]
 *     summary: Inviter un membre par email
 *     description: >
 *       Réservé au créateur (rôle `owner`). Si l'email correspond à un compte existant, le
 *       rattachement est immédiat (email de notification). Sinon, un lien d'invitation
 *       sécurisé (token à usage unique, valide 7 jours) est envoyé par email ; le
 *       rattachement se fait automatiquement à l'inscription via `inviteToken`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email: { type: string, format: email }
 *               role: { type: string, enum: [editor, commentator, reader] }
 *     responses:
 *       201:
 *         description: Membre ajouté ou invitation créée.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CookbookMember' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/members", loadCookbookAndRole, inviteValidation, validate, cookbooksController.inviteMember);

/**
 * @swagger
 * /cookbooks/{id}/members/{memberId}:
 *   patch:
 *     tags: [Cookbooks]
 *     summary: Modifier le rôle d'un membre
 *     description: Réservé au créateur (rôle `owner`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties: { role: { type: string, enum: [editor, commentator, reader] } }
 *     responses:
 *       200:
 *         description: Membre mis à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/CookbookMember' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cookbooks]
 *     summary: Retirer un membre
 *     description: Réservé au créateur (rôle `owner`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Membre retiré. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id/members/:memberId",
  loadCookbookAndRole,
  [body("role").isIn(["editor", "commentator", "reader"]).withMessage("Choisissez un rôle.")],
  validate,
  cookbooksController.updateMemberRole
);
router.delete("/:id/members/:memberId", loadCookbookAndRole, cookbooksController.removeMember);

module.exports = router;
