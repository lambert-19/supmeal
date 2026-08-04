const { Router } = require("express");
const { body } = require("express-validator");

const commentsController = require("../controllers/comments.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");

const router = Router();

router.use(requireAuth);
router.use(csrfProtection);

/**
 * @swagger
 * /recipes/{id}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Lister les commentaires d'une recette
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Commentaires.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Comment' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     tags: [Comments]
 *     summary: Ajouter un commentaire sur une recette
 *     description: Nécessite le rôle `commentator`, `editor` ou `owner` si la recette appartient à un cookbook.
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
 *             required: [text]
 *             properties: { text: { type: string, minLength: 1 } }
 *     responses:
 *       201:
 *         description: Commentaire créé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Comment' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/recipes/:id/comments", commentsController.list);
router.post(
  "/recipes/:id/comments",
  [body("text").trim().isLength({ min: 1 }).withMessage("Le commentaire ne peut pas être vide.")],
  validate,
  commentsController.create
);

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     tags: [Comments]
 *     summary: Supprimer un commentaire
 *     description: Réservé à l'auteur du commentaire.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Commentaire supprimé. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/comments/:commentId", commentsController.remove);

module.exports = router;
