const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidos.controller");
const { authRequired } = require("../middlewares/auth.middleware");

router.post("/", authRequired, pedidosController.crearPedido);
router.get("/", authRequired, pedidosController.obtenerPedidos);

module.exports = router;
