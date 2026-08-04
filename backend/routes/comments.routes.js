const { Router } = require("express");
const { body } = require("express-validator");

const commentsController = require("../controllers/comments.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");

const router = Router();

router.use(requireAuth);

router.get("/recipes/:id/comments", commentsController.list);
router.post(
  "/recipes/:id/comments",
  [body("text").trim().isLength({ min: 1 }).withMessage("Le commentaire ne peut pas être vide.")],
  validate,
  commentsController.create
);
router.delete("/comments/:commentId", commentsController.remove);

module.exports = router;
