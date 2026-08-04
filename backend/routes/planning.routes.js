const { Router } = require("express");
const { body } = require("express-validator");

const planningController = require("../controllers/planning.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

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
router.delete("/:id", planningController.remove);

module.exports = router;
