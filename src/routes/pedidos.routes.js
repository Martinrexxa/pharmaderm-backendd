const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');

router.post('/', pedidosController.crearPedido);
router.get('/', pedidosController.obtenerPedidos);

module.exports = router;

