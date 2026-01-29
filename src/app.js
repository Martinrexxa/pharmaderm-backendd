require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());

// RUTA DE PRUEBA
app.get('/', async (req, res) => {
  try {
    await pool;
    res.json({ message: 'PharmaDerm RD Backend + SQL Server conectados 🚀' });
  } catch (error) {
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

// 🔹 IMPORTAR RUTAS
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');

// 🔹 USAR RUTAS
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);

// 🔥 EL LISTEN VA SIEMPRE AL FINAL
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});
