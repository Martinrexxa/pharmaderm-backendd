const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuarios.controller");
const { authRequired } = require("../middlewares/auth.middleware");

router.post("/", authRequired, usuariosController.crearUsuario);
router.get("/", authRequired, usuariosController.obtenerUsuarios);

module.exports = router;
