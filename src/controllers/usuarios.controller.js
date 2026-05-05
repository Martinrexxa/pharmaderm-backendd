const { sql, getPool } = require("../config/database");

// CREAR USUARIO
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, telefono, estadoUsuarioID } = req.body;

    const pool = await getPool();

    await pool
      .request()
      .input("Nombre", sql.VarChar, nombre)
      .input("Apellido", sql.VarChar, apellido)
      .input("Telefono", sql.VarChar, telefono)
      .input("EstadoUsuarioID", sql.Int, estadoUsuarioID)
      .query(`
        INSERT INTO dbo.Usuarios (Nombre, Apellido, Telefono, EstadoUsuarioID)
        VALUES (@Nombre, @Apellido, @Telefono, @EstadoUsuarioID)
      `);

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando usuario" });
  }
};

// OBTENER USUARIOS
exports.obtenerUsuarios = async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query("SELECT * FROM dbo.Usuarios");

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
};
