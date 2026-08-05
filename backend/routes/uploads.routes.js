const { Router } = require("express");

const uploadsController = require("../controllers/uploads.controller");
const requireAuth = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");
const { upload } = require("../middleware/upload");

const router = Router();

router.use(requireAuth);
router.use(csrfProtection);

/**
 * @swagger
 * /uploads/images:
 *   post:
 *     tags: [Uploads]
 *     summary: Uploader des images (recettes)
 *     description: >
 *       `multipart/form-data`, champ `images` (jusqu'à 10 fichiers, 2 Mo max
 *       chacun, jpeg/png/webp/gif uniquement). Retourne les URLs absolues à
 *       réutiliser telles quelles dans `Recipe.images`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Images uploadées.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { urls: { type: array, items: { type: string } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/images", upload.array("images", 10), uploadsController.uploadImages);

module.exports = router;
