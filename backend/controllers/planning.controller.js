const planningService = require("../services/planning.service");
const asyncHandler = require("../utils/asyncHandler");

const setEntry = asyncHandler(async (req, res) => {
  const entry = await planningService.setEntry(req.user.id, req.body);
  res.status(200).json(entry);
});

const list = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const entries = await planningService.listMine(req.user.id, { from, to });
  res.json(entries);
});

const remove = asyncHandler(async (req, res) => {
  await planningService.remove(req.params.id, req.user.id);
  res.status(204).send();
});

module.exports = { setEntry, list, remove };
