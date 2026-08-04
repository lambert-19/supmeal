const { Router } = require("express");
const { body } = require("express-validator");

const planningController = require("../controllers/planning.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /planning:
 *   put:
 *     tags: [Planning]
 *     summary: Placer/remplacer une recette sur un créneau
 *     description: Upsert sur `(ownerId, date, mealSlot)` — appeler à nouveau remplace la recette du créneau.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, mealSlot, recipeId]
 *             properties:
 *               date: { type: string, example: "2026-08-04", description: "Format AAAA-MM-JJ" }
 *               mealSlot: { type: string, enum: [breakfast, lunch, dinner] }
 *               recipeId: { type: string }
 *     responses:
 *       200:
 *         description: Entrée de planning créée ou mise à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/PlanningEntry' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     tags: [Planning]
 *     summary: Lister mon planning
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2026-08-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2026-08-07" }
 *     responses:
 *       200:
 *         description: Entrées du planning dans l'intervalle demandé.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/PlanningEntry' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put(
  "/",
  [
    body("date").matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Date invalide (format AAAA-MM-JJ)."),
    body("mealSlot").isIn(["breakfast", "lunch", "dinner"]).withMessage("Créneau invalide."),
    body("recipeId").isString().notEmpty().withMessage("Recette requise."),
  ],
  validate,
  planningController.setEntry
);

router.get("/", planningController.list);

/**
 * @swagger
 * /planning/{id}:
 *   delete:
 *     tags: [Planning]
 *     summary: Retirer une entrée du planning
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Entrée supprimée. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", planningController.remove);

module.exports = router;
