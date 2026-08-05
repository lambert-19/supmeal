const messagesService = require("../services/messages.service");
const { toMessageDTO } = require("../utils/serializers");
const { canComment } = require("../utils/permissions");
const { emitNewMessage } = require("../utils/socket");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const list = asyncHandler(async (req, res) => {
  if (!req.role) throw new AppError(404, "Cookbook introuvable.");
  const messages = await messagesService.listByCookbook(req.params.id);
  res.json(messages.map(toMessageDTO));
});

const create = asyncHandler(async (req, res) => {
  if (!req.role) throw new AppError(404, "Cookbook introuvable.");
  if (!canComment(req.role)) throw new AppError(403, "Vous ne pouvez pas écrire dans cette discussion.");
  const message = await messagesService.create(req.params.id, req.user.id, {
    text: req.body.text,
    imageUrl: req.body.imageUrl,
  });
  const dto = toMessageDTO(message);
  emitNewMessage(req.params.id, dto);
  res.status(201).json(dto);
});

module.exports = { list, create };
