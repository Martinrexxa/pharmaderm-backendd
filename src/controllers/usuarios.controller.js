const { pool } = require('../config/database');

// 🔹 CREAR USUARIO
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, telefono, estadoUsuarioID } = req.body;

    const connection = await pool;

    await connection
      .request()
      .input('Nombre', nombre)
      .input('Apellido', apellido)
      .input('Telefono', telefono)
      .input('EstadoUsuarioID', estadoUsuarioID)
      .query(`
        INSERT INTO dbo.Usuarios (Nombre, Apellido, Telefono, EstadoUsuarioID)
        VALUES (@Nombre, @Apellido, @Telefono, @EstadoUsuarioID)
      `);

    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando usuario' });
  }
};

// 🔹 OBTENER USUARIOS (ESTA ES LA QUE FALTABA O ESTABA MAL)
exports.obtenerUsuarios = async (req, res) => {
  try {
    const connection = await pool;

    const result = await connection
      .request()
      .query('SELECT * FROM dbo.Usuarios');

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
};
