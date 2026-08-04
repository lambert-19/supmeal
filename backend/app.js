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

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean);

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origine non autorisée par CORS."));
    },
    credentials: true,
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

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/recipes", recipesRoutes);
app.use("/cookbooks", cookbooksRoutes);
app.use("/planning", planningRoutes);
app.use("/", commentsRoutes);
app.use("/", messagesRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "Route introuvable."));
});

app.use(errorHandler);

module.exports = app;
