const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME, // ✅ este es el correcto
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect()
  .then(() => console.log("✅ Conectado a SQL Server"))
  .catch(err => console.error("❌ Error conectando a SQL Server:", err));

module.exports = { sql, pool, poolConnect };
