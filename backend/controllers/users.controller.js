const usersService = require("../services/users.service");
const { toSafeUser } = require("../utils/serializers");
const asyncHandler = require("../utils/asyncHandler");

const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.json(toSafeUser(user));
});

const changePassword = asyncHandler(async (req, res) => {
  await usersService.changePassword(req.user.id, req.body);
  res.status(204).send();
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await usersService.updatePreferences(req.user.id, req.body);
  res.json(toSafeUser(user));
});

module.exports = { updateProfile, changePassword, updatePreferences };
