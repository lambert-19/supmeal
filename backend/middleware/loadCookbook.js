const prisma = require("../utils/prisma");
const usersService = require("../services/users.service");
const AppError = require("../utils/AppError");
const { getCookbookRole } = require("../utils/permissions");
const asyncHandler = require("../utils/asyncHandler");

const loadCookbookAndRole = asyncHandler(async (req, res, next) => {
  const cookbook = await prisma.cookbook.findUnique({
    where: { id: req.params.id },
    include: {
      members: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { recipes: true } },
    },
  });
  if (!cookbook) throw new AppError(404, "Cookbook introuvable.");

  const currentUser = await usersService.getBasicById(req.user.id);
  const role = getCookbookRole(cookbook, currentUser);

  req.cookbook = cookbook;
  req.role = role;
  next();
});

module.exports = loadCookbookAndRole;
