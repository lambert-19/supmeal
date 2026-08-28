const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const swaggerSpec = require("./utils/swagger");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const recipesRoutes = require("./routes/recipes.routes");
const cookbooksRoutes = require("./routes/cookbooks.routes");
const planningRoutes = require("./routes/planning.routes");
const commentsRoutes = require("./routes/comments.routes");
const messagesRoutes = require("./routes/messages.routes");
const uploadsRoutes = require("./routes/uploads.routes");
const allowedOrigins = require("./utils/corsOrigins");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origine non autorisée par CORS."));
    },
    credentials: true,
    // Un cookie posé par onrender.com n'est pas lisible en JS depuis
    // vercel.app (origine différente) : le jeton CSRF est donc aussi renvoyé
    // via cet en-tête de réponse (voir auth.controller.js), lisible par le
    // frontend quel que soit son domaine — il faut l'exposer explicitement,
    // sinon seuls les en-têtes "safelistés" CORS sont accessibles en JS.
    exposedHeaders: ["X-CSRF-Token"],
  })
);
app.use(cookieParser());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "supmeal-backend" });
});

app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
app.use(
  "/api-docs",
  (req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: "SUPMEAL API" })
);

// Servi avant les routes protégées : les images sont publiquement
// consultables par URL (comportement standard pour des photos de recette),
// seul l'upload (POST /uploads/images, dans uploadsRoutes) exige une session.
// Cross-Origin-Resource-Policy: same-origin (posé par helmet() par défaut)
// bloquerait sinon le chargement de l'image par le frontend (origine
// différente en dev : 5173 vs 4000) même dans une simple balise <img> —
// contrairement au CORS classique, CORP s'applique aussi à ces requêtes.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/recipes", recipesRoutes);
app.use("/cookbooks", cookbooksRoutes);
app.use("/planning", planningRoutes);
app.use("/", commentsRoutes);
app.use("/", messagesRoutes);
app.use("/uploads", uploadsRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "Route introuvable."));
});

app.use(errorHandler);

module.exports = app;
