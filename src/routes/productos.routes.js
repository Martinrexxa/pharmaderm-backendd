const express = require("express");
const router = express.Router();
const productosController = require("../controllers/productos.controller");
const { authRequired } = require("../middlewares/auth.middleware");

router.post("/", authRequired, productosController.crearProducto);

module.exports = router;
