const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolPromise = pool
  .connect()
  .then(() => {
    console.log("Conectado a SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Error conectando a SQL Server:", err);
    throw err;
  });

async function getPool() {
  return poolPromise;
}

module.exports = { sql, pool, poolPromise, getPool };
