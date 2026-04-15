const router = require('express').Router();
const mssql  = require('mssql');
const { getPool, sql } = require('../database/connection');
const auth   = require('../middleware/auth');

// Créditos concedidos ao assinar cada plano
const CREDITOS_PLANO = { basico: 10, premium: 20, anual: 15 };

// ── GET /api/assinaturas/ativa/:userId ────────────────────────────────────────
router.get('/ativa/:userId', auth, async (req, res) => {
  if (parseInt(req.params.userId) !== req.userId)
    return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('uid', sql.Int, req.userId)
      .query(`
        SELECT TOP 1
          id,
          plano_id    AS planoId,
          nome_plano  AS nomePlano,
          ativa,
          data_criacao
        FROM assinaturas
        WHERE usuario_id = @uid AND ativa = 1
        ORDER BY data_criacao DESC
      `);
    // null se não houver assinatura ativa — o app mobile trata isso
    return res.json(result.recordset[0] ?? null);
  } catch (err) {
    console.error('[assinaturas/ativa]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/assinaturas ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { planoId, nome } = req.body;
  if (!planoId || !nome)
    return res.status(400).json({ error: 'planoId e nome são obrigatórios.' });

  const pool = await getPool();
  const transaction = new mssql.Transaction(pool);
  try {
    await transaction.begin();

    // Desativa assinaturas anteriores
    const r1 = new mssql.Request(transaction);
    await r1
      .input('uid', sql.Int, req.userId)
      .query('UPDATE assinaturas SET ativa = 0 WHERE usuario_id = @uid');

    // Cria nova assinatura
    const r2 = new mssql.Request(transaction);
    const ins = await r2
      .input('uid',   sql.Int,     req.userId)
      .input('pid',   sql.VarChar, planoId)
      .input('nome',  sql.VarChar, nome)
      .query(`
        INSERT INTO assinaturas (usuario_id, plano_id, nome_plano, ativa)
        OUTPUT INSERTED.id,
               INSERTED.plano_id   AS planoId,
               INSERTED.nome_plano AS nomePlano,
               INSERTED.ativa
        VALUES (@uid, @pid, @nome, 1)
      `);

    // Créditos iniciais do plano
    const creditos = CREDITOS_PLANO[planoId] ?? 10;

    const r3 = new mssql.Request(transaction);
    await r3
      .input('uid', sql.Int,          req.userId)
      .input('val', sql.Decimal(10,2), creditos)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM creditos WHERE usuario_id = @uid)
          INSERT INTO creditos (usuario_id, saldo) VALUES (@uid, 0);
        UPDATE creditos SET saldo = saldo + @val WHERE usuario_id = @uid;
      `);

    const r4 = new mssql.Request(transaction);
    await r4
      .input('uid',  sql.Int,          req.userId)
      .input('desc', sql.VarChar,      `Assinatura Plano ${nome} — créditos iniciais`)
      .input('val',  sql.Decimal(10,2), creditos)
      .query(`
        INSERT INTO extrato_creditos (usuario_id, tipo, descricao, valor)
        VALUES (@uid, 'credito', @desc, @val)
      `);

    await transaction.commit();
    return res.status(201).json(ins.recordset[0]);
  } catch (err) {
    await transaction.rollback();
    console.error('[assinaturas/criar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
