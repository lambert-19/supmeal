const PASSWORD_RULES = { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 };
const PASSWORD_MESSAGE =
  "8 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.";

module.exports = { PASSWORD_RULES, PASSWORD_MESSAGE };
