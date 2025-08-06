const express = require("express");
const routes = express.Router();
const authMiddleware = require("./middleware/authMiddleware");
const multer = require("multer");
const upload = multer();

// Controllers
const UserController = require("./controllers/UserController");
const CreditController = require("./controllers/CreditController");
const PhotoController = require("./controllers/PhotoController");

// Routes
routes.get("/", async (req, res) => {
  try {
    const knex = require('knex')(require('../knexfile').production); 
    const result = await knex.raw("SELECT 1 + 1 AS resultado");
    res.json({ status: "ok", result: result[0] });
  } catch (error) {
    console.error("❌ Erro na conexão com o banco:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

routes.post("/register", UserController.register);
routes.post("/login", UserController.login);
routes.get("/users/credits", authMiddleware, UserController.getCreditsById);

routes.post("/create-checkout-session", authMiddleware, CreditController.createCheckoutSession);
routes.post("/webhook/stripe", CreditController.handleWebhook);

routes.get("/photos", authMiddleware, PhotoController.listByUser);
routes.post("/photos/generate", authMiddleware, upload.single("file"), PhotoController.create);
routes.get("/download/:photo_id/:which", authMiddleware, PhotoController.download);

module.exports = routes;