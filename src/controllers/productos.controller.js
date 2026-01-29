const { sql, pool } = require('../config/database');

exports.crearProducto = async (req, res) => {
  try {
    const {
      nombreProducto,
      descripcion,
      precio,
      stock,
      marcaID,
      tipoPielID
    } = req.body;

    const request = (await pool).request();
    await request
      .input('NombreProducto', sql.VarChar, nombreProducto)
      .input('Descripcion', sql.Text, descripcion)
      .input('Precio', sql.Decimal(10,2), precio)
      .input('Stock', sql.Int, stock)
      .input('MarcaID', sql.Int, marcaID)
      .input('TipoPielID', sql.Int, tipoPielID)
      .query(`
        INSERT INTO Productos
        (NombreProducto, Descripcion, Precio, Stock, MarcaID, TipoPielID)
        VALUES
        (@NombreProducto, @Descripcion, @Precio, @Stock, @MarcaID, @TipoPielID)
      `);

    res.status(201).json({ message: 'Producto creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando producto' });
  }
};
