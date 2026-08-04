const { Router } = require("express");
const { body } = require("express-validator");

const cookbooksController = require("../controllers/cookbooks.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const loadCookbookAndRole = require("../middleware/loadCookbook");

const router = Router();

router.use(requireAuth);

const cookbookValidation = [
  body("name").trim().isLength({ min: 2 }).withMessage("Le nom doit contenir au moins 2 caractères."),
];

const inviteValidation = [
  body("email").trim().isEmail().withMessage("Email invalide."),
  body("role").isIn(["editor", "commentator", "reader"]).withMessage("Choisissez un rôle."),
];

router.get("/", cookbooksController.list);
router.post("/", cookbookValidation, validate, cookbooksController.create);

router.get("/:id", loadCookbookAndRole, cookbooksController.getOne);
router.patch("/:id", loadCookbookAndRole, cookbookValidation, validate, cookbooksController.update);
router.delete("/:id", loadCookbookAndRole, cookbooksController.remove);

router.get("/:id/recipes", loadCookbookAndRole, cookbooksController.listRecipes);
router.post("/:id/recipes/:recipeId", loadCookbookAndRole, cookbooksController.attachRecipe);
router.delete("/:id/recipes/:recipeId", loadCookbookAndRole, cookbooksController.detachRecipe);

router.post("/:id/members", loadCookbookAndRole, inviteValidation, validate, cookbooksController.inviteMember);
router.patch(
  "/:id/members/:memberId",
  loadCookbookAndRole,
  [body("role").isIn(["editor", "commentator", "reader"]).withMessage("Choisissez un rôle.")],
  validate,
  cookbooksController.updateMemberRole
);
router.delete("/:id/members/:memberId", loadCookbookAndRole, cookbooksController.removeMember);

module.exports = router;
