const { Router } = require("express");
const { body } = require("express-validator");

const messagesController = require("../controllers/messages.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");
const loadCookbookAndRole = require("../middleware/loadCookbook");

const router = Router();

router.use(requireAuth);
router.use(csrfProtection);

/**
 * @swagger
 * /cookbooks/{id}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Lister les messages d'un cookbook
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Message' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     tags: [Messages]
 *     summary: Poster un message dans un cookbook
 *     description: Nécessite le rôle `commentator`, `editor` ou `owner`.
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
 *             description: Au moins un des deux champs (`text` ou `imageUrl`) est requis.
 *             properties:
 *               text: { type: string }
 *               imageUrl: { type: string, description: "URL renvoyée par POST /uploads/images (sticker/image)" }
 *     responses:
 *       201:
 *         description: Message créé.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Message' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/cookbooks/:id/messages", loadCookbookAndRole, messagesController.list);
router.post(
  "/cookbooks/:id/messages",
  loadCookbookAndRole,
  [
    body("text").optional().trim().isString(),
    body("imageUrl").optional().isString(),
    body().custom((value) => {
      if (!value.text?.trim() && !value.imageUrl) {
        throw new Error("Le message doit contenir du texte ou une image.");
      }
      return true;
    }),
  ],
  validate,
  messagesController.create
);

module.exports = router;
