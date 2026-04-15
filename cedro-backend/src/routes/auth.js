const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../database/connection');
const auth    = require('../middleware/auth');

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.VarChar, email.trim().toLowerCase())
      .query(`
        SELECT id, nome, email, telefone, senha_hash, tipo_usuario, ativo
        FROM usuarios
        WHERE email = @email
      `);

    const user = result.recordset[0];
    if (!user || !user.ativo)
      return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const senhaOk = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaOk)
      return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const token = jwt.sign(
      { id: user.id, tipo: user.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    return res.json({
      token,
      usuarioResponse: {
        id:       user.id,
        nome:     user.nome,
        email:    user.email,
        telefone: user.telefone,
        // 'role' é o nome que o app mobile usa — mapeamos tipo_usuario → role
        role:     user.tipo_usuario.toUpperCase(),
      },
    });
  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/auth/cadastro ───────────────────────────────────────────────────
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome?.trim() || !email?.trim() || !senha)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  if (senha.length < 6)
    return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' });

  try {
    const pool = await getPool();

    const dup = await pool.request()
      .input('email', sql.VarChar, email.trim().toLowerCase())
      .query('SELECT id FROM usuarios WHERE email = @email');
    if (dup.recordset.length > 0)
      return res.status(409).json({ error: 'Email já cadastrado.' });

    const hash = await bcrypt.hash(senha, 10);
    const ins = await pool.request()
      .input('nome',     sql.VarChar, nome.trim())
      .input('email',    sql.VarChar, email.trim().toLowerCase())
      .input('hash',     sql.VarChar, hash)
      .input('telefone', sql.VarChar, telefone?.trim() || null)
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo_usuario)
        OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email, INSERTED.telefone, INSERTED.tipo_usuario
        VALUES (@nome, @email, @hash, @telefone, 'paciente')
      `);
    const user = ins.recordset[0];

    // Cria carteira de créditos zerada
    await pool.request()
      .input('uid', sql.Int, user.id)
      .query('INSERT INTO creditos (usuario_id, saldo) VALUES (@uid, 0)');

    return res.status(201).json({
      id:       user.id,
      nome:     user.nome,
      email:    user.email,
      telefone: user.telefone,
      role:     user.tipo_usuario.toUpperCase(),
    });
  } catch (err) {
    console.error('[auth/cadastro]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PUT /api/auth/perfil ──────────────────────────────────────────────────────
router.put('/perfil', auth, async (req, res) => {
  const { nome, email, telefone } = req.body;
  if (!nome?.trim() || !email?.trim())
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });

  try {
    const pool = await getPool();

    const dup = await pool.request()
      .input('email', sql.VarChar, email.trim().toLowerCase())
      .input('id',    sql.Int,     req.userId)
      .query('SELECT id FROM usuarios WHERE email = @email AND id != @id');
    if (dup.recordset.length > 0)
      return res.status(409).json({ error: 'Email já em uso por outra conta.' });

    const upd = await pool.request()
      .input('nome',     sql.VarChar, nome.trim())
      .input('email',    sql.VarChar, email.trim().toLowerCase())
      .input('telefone', sql.VarChar, telefone?.trim() || null)
      .input('id',       sql.Int,     req.userId)
      .query(`
        UPDATE usuarios
        SET nome = @nome, email = @email, telefone = @telefone
        OUTPUT INSERTED.id, INSERTED.nome, INSERTED.email,
               INSERTED.telefone, INSERTED.tipo_usuario
        WHERE id = @id
      `);

    const user = upd.recordset[0];
    return res.json({
      id:       user.id,
      nome:     user.nome,
      email:    user.email,
      telefone: user.telefone,
      role:     user.tipo_usuario.toUpperCase(),
    });
  } catch (err) {
    console.error('[auth/perfil]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
