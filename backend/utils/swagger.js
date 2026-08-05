const swaggerJSDoc = require("swagger-jsdoc");

const cookieName = process.env.COOKIE_NAME || "supmeal_token";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "SUPMEAL API",
    version: "1.0.0",
    description:
      "API du projet SUPMEAL (recettes, cookbooks partagés, planning de repas). " +
      `Authentification par cookie httpOnly ("${cookieName}") posé par /auth/login — pas de header Authorization.`,
  },
  servers: [{ url: "/", description: "Serveur courant" }],
  tags: [
    { name: "Auth", description: "Inscription, connexion, vérification d'email, mot de passe oublié" },
    { name: "Users", description: "Profil, mot de passe, préférences de l'utilisateur connecté" },
    { name: "Recipes", description: "Recettes personnelles" },
    { name: "Cookbooks", description: "Cookbooks partagés, membres, invitations" },
    { name: "Planning", description: "Planning de repas" },
    { name: "Comments", description: "Commentaires sur les recettes" },
    { name: "Messages", description: "Messagerie d'un cookbook" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: cookieName,
        description: "Cookie httpOnly posé par POST /auth/login (JWT signé, 7 jours).",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          details: { type: "array", items: { type: "object" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          hasPassword: {
            type: "boolean",
            description: "Faux pour un compte créé via OAuth2 tant qu'aucun vrai mot de passe n'a été défini.",
          },
          preferences: {
            type: "object",
            properties: {
              dietaryRegime: { type: "string" },
              allergies: { type: "array", items: { type: "string" } },
              favoriteCuisine: { type: "string" },
              defaultServings: { type: "integer" },
            },
          },
          connections: {
            type: "object",
            properties: {
              google: { type: "boolean" },
              github: { type: "boolean" },
            },
          },
        },
      },
      Ingredient: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          quantity: { type: "string" },
          unit: { type: "string" },
        },
      },
      Step: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string" } },
      },
      RecipeInput: {
        type: "object",
        required: ["title", "ingredients", "steps", "prepTime", "cookTime", "servings"],
        properties: {
          title: { type: "string", minLength: 2 },
          ingredients: { type: "array", items: { $ref: "#/components/schemas/Ingredient" }, minItems: 1 },
          steps: { type: "array", items: { $ref: "#/components/schemas/Step" }, minItems: 1 },
          prepTime: { type: "integer", minimum: 0 },
          cookTime: { type: "integer", minimum: 0 },
          servings: { type: "integer", minimum: 1, maximum: 50 },
          tags: { type: "array", items: { type: "string" } },
          images: { type: "array", items: { type: "string" }, maxItems: 10, description: "Data URLs base64" },
          source: { type: "string" },
        },
      },
      Recipe: {
        allOf: [
          { $ref: "#/components/schemas/RecipeInput" },
          {
            type: "object",
            properties: {
              id: { type: "string" },
              ownerId: { type: "string" },
              favorite: { type: "boolean" },
              cookbookId: { type: "string", nullable: true },
              cookbook: {
                type: "object",
                nullable: true,
                properties: { id: { type: "string" }, name: { type: "string" } },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      CookbookMember: {
        type: "object",
        properties: {
          id: { type: "string" },
          cookbookId: { type: "string" },
          userId: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          role: { type: "string", enum: ["editor", "commentator", "reader"] },
          pending: { type: "boolean", description: "true si l'invitation n'a pas encore été acceptée (pas de compte lié)" },
        },
      },
      Cookbook: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          ownerId: { type: "string" },
          owner: {
            type: "object",
            properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string", format: "email" } },
          },
          recipesCount: { type: "integer", description: "Nombre de recettes rattachées au cookbook (tous membres confondus)." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          members: { type: "array", items: { $ref: "#/components/schemas/CookbookMember" } },
        },
      },
      PlanningEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          ownerId: { type: "string" },
          date: { type: "string", example: "2026-08-04" },
          mealSlot: { type: "string", enum: ["breakfast", "lunch", "dinner"] },
          recipeId: { type: "string", nullable: true },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "string" },
          recipeId: { type: "string" },
          authorId: { type: "string" },
          authorName: { type: "string" },
          text: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Message: {
        type: "object",
        properties: {
          id: { type: "string" },
          cookbookId: { type: "string" },
          authorId: { type: "string" },
          authorName: { type: "string" },
          text: { type: "string" },
          imageUrl: { type: "string", nullable: true, description: "Sticker/image jointe au message, le cas échéant" },
          delivered: { type: "boolean", description: "Au moins un autre membre a reçu ce message" },
          read: { type: "boolean", description: "Au moins un autre membre a lu ce message" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Non authentifié (cookie manquant ou invalide).",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Rôle insuffisant pour cette action.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Ressource introuvable (ou non accessible — 404 utilisé aussi pour masquer un accès refusé).",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Corps de requête invalide.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ cookieAuth: [] }],
};

const options = {
  definition,
  apis: ["./routes/*.routes.js"],
};

module.exports = swaggerJSDoc(options);
