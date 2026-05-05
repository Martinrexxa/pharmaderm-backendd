const crypto = require("crypto");
const { sql, getPool } = require("../config/database");
const jwt = require("jsonwebtoken");
const { sendMail, isEmailConfigured } = require("../services/email.service");

exports.login = async (req, res) => {
  try {
    const Email = req.body?.Email ?? req.body?.email;
    const Contrasena =
      req.body?.Contrasena ?? req.body?.contrasena ?? req.body?.password;

    if (!Email || !Contrasena) {
      return res.status(400).json({ error: "Email y contrasena requeridos" });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("Email", sql.VarChar, String(Email).trim())
      .input("Contrasena", sql.VarChar, Contrasena)
      .query(`
        SELECT UsuarioID, Nombre, Apellido, Email, Telefono, EstadoUsuarioID
        FROM dbo.Usuarios
        WHERE Email = @Email AND Contrasena = @Contrasena
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Usuario o contrasena incorrectos" });
    }

    const usuario = result.recordset[0];

    const token = jwt.sign(
      {
        sub: usuario.UsuarioID,
        email: usuario.Email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      message: "Login correcto",
      token,
      usuario: {
        id: usuario.UsuarioID,
        nombre: usuario.Nombre,
        apellido: usuario.Apellido,
        email: usuario.Email,
        telefono: usuario.Telefono,
        estadoUsuarioId: usuario.EstadoUsuarioID,
      },
    });
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

exports.register = async (req, res) => {
  try {
    const { Nombre, Apellido, Email, Telefono, Contrasena } = req.body;

    if (!Nombre || !Apellido || !Email || !Telefono || !Contrasena) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const pool = await getPool();

    const existe = await pool
      .request()
      .input("Email", sql.VarChar, String(Email).trim())
      .query("SELECT UsuarioID FROM dbo.Usuarios WHERE Email = @Email");

    if (existe.recordset.length > 0) {
      return res.status(400).json({ error: "Correo ya registrado" });
    }

    await pool
      .request()
      .input("Nombre", sql.VarChar, String(Nombre).trim())
      .input("Apellido", sql.VarChar, String(Apellido).trim())
      .input("Email", sql.VarChar, String(Email).trim())
      .input("Telefono", sql.VarChar, String(Telefono).trim())
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

exports.forgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;

    if (!Email) {
      return res.status(400).json({ error: "Email requerido" });
    }

    const pool = await getPool();
    const user = await pool
      .request()
      .input("Email", sql.VarChar, String(Email).trim())
      .query("SELECT UsuarioID, Email FROM dbo.Usuarios WHERE Email = @Email");

    // Always respond OK to avoid leaking registered emails
    if (user.recordset.length === 0) {
      return res.json({ message: "Si el correo existe, te enviaremos un enlace." });
    }

    const usuarioID = user.recordset[0].UsuarioID;
    const email = user.recordset[0].Email;
    const token = crypto.randomBytes(32).toString("hex");
    const expiraMin = 15;

    await pool
      .request()
      .input("UsuarioID", sql.Int, usuarioID)
      .input("Token", sql.VarChar, token)
      .input("ExpiraEn", sql.DateTime, new Date(Date.now() + expiraMin * 60 * 1000))
      .query(`
        INSERT INTO dbo.PasswordResetTokens (UsuarioID, Token, ExpiraEn, Usado)
        VALUES (@UsuarioID, @Token, @ExpiraEn, 0)
      `);

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendBase}/reset-password?token=${token}`;

    const subject = "Recuperación de contraseña";
    const text = `Usa este enlace para restablecer tu contraseña (expira en ${expiraMin} minutos): ${link}`;
    const html = `
      <p>Hola,</p>
      <p>Usa este enlace para restablecer tu contraseña (expira en ${expiraMin} minutos):</p>
      <p><a href="${link}">${link}</a></p>
    `;

    const mailResult = await sendMail({ to: email, subject, text, html });
    if (mailResult.skipped) {
      console.log("LINK RESET (DEV):", link);
      console.log("(SMTP no configurado: setea SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM)");
    }

    return res.json({ message: "Si el correo existe, te enviaremos un enlace." });
  } catch (error) {
    console.error("ERROR FORGOT:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, Contrasena } = req.body;

    if (!token || !Contrasena) {
      return res.status(400).json({ error: "Token y contrasena requeridos" });
    }

    const pool = await getPool();
    const tokenRow = await pool
      .request()
      .input("Token", sql.VarChar, token)
      .query(`
        SELECT TOP 1 TokenID, UsuarioID, ExpiraEn, Usado
        FROM dbo.PasswordResetTokens
        WHERE Token = @Token
        ORDER BY TokenID DESC
      `);

    if (tokenRow.recordset.length === 0) {
      return res.status(400).json({ error: "Token invalido" });
    }

    const savedToken = tokenRow.recordset[0];

    if (savedToken.Usado) {
      return res.status(400).json({ error: "Token ya fue usado" });
    }

    if (new Date(savedToken.ExpiraEn) < new Date()) {
      return res.status(400).json({ error: "Token expirado" });
    }

    await pool
      .request()
      .input("UsuarioID", sql.Int, savedToken.UsuarioID)
      .input("Contrasena", sql.VarChar, Contrasena)
      .query(`
        UPDATE dbo.Usuarios
        SET Contrasena = @Contrasena
        WHERE UsuarioID = @UsuarioID
      `);

    await pool
      .request()
      .input("TokenID", sql.Int, savedToken.TokenID)
      .query("UPDATE dbo.PasswordResetTokens SET Usado = 1 WHERE TokenID = @TokenID");

    res.json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    console.error("ERROR RESET:", error);
    res.status(500).json({ error: "Error interno" });
  }
};
