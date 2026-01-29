const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

router.post('/', productosController.crearProducto);

module.exports = router;
