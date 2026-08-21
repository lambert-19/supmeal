const usersService = require("../services/users.service");
const oauthService = require("../services/oauth.service");
const { toSafeUser } = require("../utils/serializers");
const { signToken, cookieOptions } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");

const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.json(toSafeUser(user));
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await usersService.changePassword(req.user.id, req.body);
  // Le changement de mot de passe incrémente tokenVersion (voir service), ce
  // qui invaliderait aussi le cookie de la requête en cours — on le réémet
  // donc à jour pour ne pas déconnecter l'utilisateur de sa propre action.
  const token = signToken(user.id, user.tokenVersion);
  res.cookie(process.env.COOKIE_NAME, token, cookieOptions());
  res.status(204).send();
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await usersService.updatePreferences(req.user.id, req.body);
  res.json(toSafeUser(user));
});

const unlinkOAuthProvider = asyncHandler(async (req, res) => {
  await oauthService.unlinkAccount(req.user.id, req.params.provider);
  const user = await usersService.getWithOAuthAccounts(req.user.id);
  res.json(toSafeUser(user));
});

module.exports = { updateProfile, changePassword, updatePreferences, unlinkOAuthProvider };
