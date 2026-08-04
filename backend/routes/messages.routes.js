const { Router } = require("express");
const { body } = require("express-validator");

const messagesController = require("../controllers/messages.controller");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const loadCookbookAndRole = require("../middleware/loadCookbook");

const router = Router();

router.use(requireAuth);

router.get("/cookbooks/:id/messages", loadCookbookAndRole, messagesController.list);
router.post(
  "/cookbooks/:id/messages",
  loadCookbookAndRole,
  [body("text").trim().isLength({ min: 1 }).withMessage("Le message ne peut pas être vide.")],
  validate,
  messagesController.create
);

module.exports = router;
