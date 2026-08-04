const { Router } = require("express");
const { body } = require("express-validator");

const recipesController = require("../controllers/recipes.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

const recipeValidation = [
  body("title").trim().isLength({ min: 2 }).withMessage("Le titre doit contenir au moins 2 caractères."),
  body("ingredients").isArray({ min: 1 }).withMessage("Ajoutez au moins un ingrédient."),
  body("ingredients.*.name").trim().isLength({ min: 1 }).withMessage("Nom d'ingrédient requis."),
  body("steps").isArray({ min: 1 }).withMessage("Ajoutez au moins une étape."),
  body("steps.*.text").trim().isLength({ min: 1 }).withMessage("L'étape ne peut pas être vide."),
  body("prepTime").isInt({ min: 0 }).withMessage("Doit être positif ou nul."),
  body("cookTime").isInt({ min: 0 }).withMessage("Doit être positif ou nul."),
  body("servings").isInt({ min: 1, max: 50 }).withMessage("Entre 1 et 50 portions."),
  body("images").optional().isArray({ max: 10 }).withMessage("10 images maximum."),
];

router.get("/", recipesController.list);
router.get("/:id", recipesController.getOne);
router.post("/", recipeValidation, validate, recipesController.create);
router.patch("/:id", recipesController.update);
router.delete("/:id", recipesController.remove);
router.patch("/:id/favorite", recipesController.toggleFavorite);

module.exports = router;
