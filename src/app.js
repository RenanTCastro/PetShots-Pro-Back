const express = require("express");
const routes = require("./routes");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(routes);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: 'Ocorreu um erro! Tente novamente mais tarde.' });
});

app.get('/test-db', async (req, res) => {
  try {
    const knex = require('knex')(require('../knexfile').production); 
    const result = await knex.raw("SELECT 1 + 1 AS resultado");
    res.json({ status: "ok", result: result[0] });
  } catch (error) {
    console.error("❌ Erro na conexão com o banco:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => {
  try {
    console.log(`Server listening on ${PORT}`);
  } catch (Error) {
    console.log("Error runnig app", Error);
  }
});