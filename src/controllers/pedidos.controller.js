const { sql, getPool } = require("../config/database");

// ================== CREAR PEDIDO ==================
exports.crearPedido = async (req, res) => {
  const { usuarioID, productos } = req.body;

  if (!usuarioID || !productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  let transaction;

  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Insertar pedido
    const pedidoRequest = new sql.Request(transaction);
    const pedidoResult = await pedidoRequest
      .input("UsuarioID", sql.Int, usuarioID)
      .query(`
        INSERT INTO Pedidos (UsuarioID, FechaPedido)
        OUTPUT INSERTED.PedidoID
        VALUES (@UsuarioID, GETDATE())
      `);

    const pedidoID = pedidoResult.recordset[0].PedidoID;

    // Insertar detalles
    for (const item of productos) {
      const detalleRequest = new sql.Request(transaction);
      await detalleRequest
        .input("PedidoID", sql.Int, pedidoID)
        .input("ProductoID", sql.Int, item.productoID)
        .input("Cantidad", sql.Int, item.cantidad)
        .input("PrecioUnitario", sql.Decimal(10, 2), item.precio)
        .query(`
          INSERT INTO PedidoDetalle
          (PedidoID, ProductoID, Cantidad, PrecioUnitario)
          VALUES (@PedidoID, @ProductoID, @Cantidad, @PrecioUnitario)
        `);
    }

    await transaction.commit();

    res.status(201).json({ message: "Pedido creado correctamente", pedidoID });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Error creando pedido" });
  }
};

// ================== OBTENER PEDIDOS ==================
exports.obtenerPedidos = async (_req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        p.PedidoID,
        p.UsuarioID,
        p.FechaPedido
      FROM Pedidos p
      ORDER BY p.PedidoID DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
};
