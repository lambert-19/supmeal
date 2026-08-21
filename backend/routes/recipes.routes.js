const { Router } = require("express");
const { body } = require("express-validator");

const recipesController = require("../controllers/recipes.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const csrfProtection = require("../middleware/csrf");

const router = Router();

router.use(requireAuth);
router.use(csrfProtection);

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
  body("images.*").optional().isString(),
];

// PATCH : mêmes règles que la création, mais chaque champ est optionnel
// puisqu'on peut ne modifier qu'une partie de la recette.
const recipeUpdateValidation = [
  body("title").optional().trim().isLength({ min: 2 }).withMessage("Le titre doit contenir au moins 2 caractères."),
  body("ingredients").optional().isArray({ min: 1 }).withMessage("Ajoutez au moins un ingrédient."),
  body("ingredients.*.name").optional().trim().isLength({ min: 1 }).withMessage("Nom d'ingrédient requis."),
  body("steps").optional().isArray({ min: 1 }).withMessage("Ajoutez au moins une étape."),
  body("steps.*.text").optional().trim().isLength({ min: 1 }).withMessage("L'étape ne peut pas être vide."),
  body("prepTime").optional().isInt({ min: 0 }).withMessage("Doit être positif ou nul."),
  body("cookTime").optional().isInt({ min: 0 }).withMessage("Doit être positif ou nul."),
  body("servings").optional().isInt({ min: 1, max: 50 }).withMessage("Entre 1 et 50 portions."),
  body("images").optional().isArray({ max: 10 }).withMessage("10 images maximum."),
  body("images.*").optional().isString(),
  body("tags").optional().isArray().withMessage("Format de tags invalide."),
  body("source").optional().isString(),
];

/**
 * @swagger
 * /recipes:
 *   get:
 *     tags: [Recipes]
 *     summary: Lister mes recettes
 *     description: Recherche texte, filtre par tags/durée/favoris (paramètres selon `recipes.service.js`).
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Recherche texte dans le titre.
 *       - in: query
 *         name: favorite
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Liste des recettes de l'utilisateur connecté.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Recipe' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Recipes]
 *     summary: Créer une recette
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/RecipeInput' } } }
 *     responses:
 *       201:
 *         description: Recette créée.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", recipesController.list);

/**
 * @swagger
 * /recipes/suggestions:
 *   get:
 *     tags: [Recipes]
 *     summary: Suggestions intelligentes de recettes
 *     description: >
 *       Classe les recettes de l'utilisateur connecté (hors favoris) selon son régime
 *       alimentaire, sa cuisine préférée, la nouveauté par rapport à son planning, l'affinité
 *       de tags avec ses favoris, et optionnellement les ingrédients qu'il indique avoir sous
 *       la main. Les recettes contenant un allergène déclaré sont exclues.
 *     parameters:
 *       - in: query
 *         name: ingredients
 *         schema: { type: string }
 *         description: Liste d'ingrédients disponibles, séparés par des virgules.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8, minimum: 1, maximum: 20 }
 *     responses:
 *       200:
 *         description: Recettes suggérées, triées par pertinence décroissante.
 *         content: { application/json: { schema: { type: array, items: { $ref: '#/components/schemas/Recipe' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/suggestions", recipesController.suggestions);

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     tags: [Recipes]
 *     summary: Détail d'une recette
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recette.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Recipes]
 *     summary: Modifier une recette
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/RecipeInput' } } }
 *     responses:
 *       200:
 *         description: Recette mise à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Recipes]
 *     summary: Supprimer une recette
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Recette supprimée. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", recipesController.getOne);
router.post("/", recipeValidation, validate, recipesController.create);
router.patch("/:id", recipeUpdateValidation, validate, recipesController.update);
router.delete("/:id", recipesController.remove);

/**
 * @swagger
 * /recipes/{id}/favorite:
 *   patch:
 *     tags: [Recipes]
 *     summary: Basculer le statut favori
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recette mise à jour.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Recipe' } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id/favorite", recipesController.toggleFavorite);

module.exports = router;
