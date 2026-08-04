const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");
const { getCookbookRole } = require("../utils/permissions");
const asyncHandler = require("../utils/asyncHandler");

const loadCookbookAndRole = asyncHandler(async (req, res, next) => {
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!cookbook) throw new AppError(404, "Cookbook introuvable.");

  const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true } });
  const role = getCookbookRole(cookbook, currentUser);

  req.cookbook = cookbook;
  req.role = role;
  next();
});

module.exports = loadCookbookAndRole;
