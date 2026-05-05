require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getPool } = require("./config/database");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/db-health", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS databaseName,
        @@SERVERNAME AS serverName
    `);

    res.json({
      ok: true,
      database: result.recordset[0]?.databaseName || null,
      server: result.recordset[0]?.serverName || null,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || "No se pudo conectar a la base de datos",
    });
  }
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/pedidos", require("./routes/pedidos.routes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
