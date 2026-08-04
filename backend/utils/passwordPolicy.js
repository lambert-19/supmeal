const PASSWORD_RULES = { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 };
const PASSWORD_MESSAGE = "8 caractères minimum, avec au moins une majuscule, une minuscule et un chiffre.";

module.exports = { PASSWORD_RULES, PASSWORD_MESSAGE };
