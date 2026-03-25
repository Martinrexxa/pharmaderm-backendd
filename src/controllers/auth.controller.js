const { sql, pool } = require("../config/database");
const crypto = require("crypto");

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { Email, Contrasena } = req.body;

    if (!Email || !Contrasena) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    const poolConn = await pool; // ✅ pool es una promesa

    const result = await poolConn
      .request()
      .input("Email", sql.VarChar, Email)
      .input("Contrasena", sql.VarChar, Contrasena)
      .query(`
        SELECT UsuarioID, Nombre, Apellido, Email
        FROM dbo.Usuarios
        WHERE Email = @Email AND Contrasena = @Contrasena
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    res.json({ message: "Login correcto", usuario: result.recordset[0] });
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    const { Nombre, Apellido, Email, Telefono, Contrasena } = req.body;

    if (!Nombre || !Apellido || !Email || !Telefono || !Contrasena) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const poolConn = await pool;

    const existe = await poolConn
      .request()
      .input("Email", sql.VarChar, Email)
      .query("SELECT UsuarioID FROM dbo.Usuarios WHERE Email = @Email");

    if (existe.recordset.length > 0) {
      return res.status(400).json({ error: "Correo ya registrado" });
    }

    await poolConn
      .request()
      .input("Nombre", sql.VarChar, Nombre)
      .input("Apellido", sql.VarChar, Apellido)
      .input("Email", sql.VarChar, Email)
      .input("Telefono", sql.VarChar, Telefono)
      .input("Contrasena", sql.VarChar, Contrasena)
      .query(`
        INSERT INTO dbo.Usuarios
        (Nombre, Apellido, Email, Telefono, Contrasena, EstadoUsuarioID)
        VALUES
        (@Nombre, @Apellido, @Email, @Telefono, @Contrasena, 1)
      `);

    res.status(201).json({ message: "Registro correcto" });
  } catch (error) {
    console.error("ERROR REGISTER:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

// ✅ FORGOT PASSWORD (DEV: imprime link en consola)
exports.forgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;
    if (!Email) return res.status(400).json({ error: "Email requerido" });

    const poolConn = await pool;

    const user = await poolConn
      .request()
      .input("Email", sql.VarChar, Email)
      .query(`SELECT UsuarioID, Email FROM dbo.Usuarios WHERE Email = @Email`);

    // Por seguridad, no decimos si existe o no
    if (user.recordset.length === 0) {
      return res.json({ message: "Si el correo existe, te enviaremos un enlace." });
    }

    const usuarioID = user.recordset[0].UsuarioID;

    const token = crypto.randomBytes(32).toString("hex");
    const expiraMin = 15;

    // ⚠️ Esto requiere la tabla dbo.PasswordResetTokens (te digo abajo cómo crearla)
    await poolConn
      .request()
      .input("UsuarioID", sql.Int, usuarioID)
      .input("Token", sql.VarChar, token)
      .input("ExpiraEn", sql.DateTime, new Date(Date.now() + expiraMin * 60 * 1000))
      .query(`
        INSERT INTO dbo.PasswordResetTokens (UsuarioID, Token, ExpiraEn, Usado)
        VALUES (@UsuarioID, @Token, @ExpiraEn, 0)
      `);

    const link = `http://localhost:5173/reset-password?token=${token}`;
    console.log("🔗 LINK RESET (DEV):", link);

    return res.json({ message: "Si el correo existe, te enviaremos un enlace." });
  } catch (error) {
    console.error("ERROR FORGOT:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

// ✅ RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, Contrasena } = req.body;
    if (!token || !Contrasena) {
      return res.status(400).json({ error: "Token y contraseña requeridos" });
    }

    const poolConn = await pool;

    const tokenRow = await poolConn
      .request()
      .input("Token", sql.VarChar, token)
      .query(`
        SELECT TOP 1 TokenID, UsuarioID, ExpiraEn, Usado
        FROM dbo.PasswordResetTokens
        WHERE Token = @Token
        ORDER BY TokenID DESC
      `);

    if (tokenRow.recordset.length === 0) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const t = tokenRow.recordset[0];

    if (t.Usado) return res.status(400).json({ error: "Token ya fue usado" });
    if (new Date(t.ExpiraEn) < new Date()) return res.status(400).json({ error: "Token expirado" });

    await poolConn
      .request()
      .input("UsuarioID", sql.Int, t.UsuarioID)
      .input("Contrasena", sql.VarChar, Contrasena)
      .query(`
        UPDATE dbo.Usuarios
        SET Contrasena = @Contrasena
        WHERE UsuarioID = @UsuarioID
      `);

    await poolConn
      .request()
      .input("TokenID", sql.Int, t.TokenID)
      .query(`UPDATE dbo.PasswordResetTokens SET Usado = 1 WHERE TokenID = @TokenID`);

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("ERROR RESET:", error);
    res.status(500).json({ error: "Error interno" });
  }
};
