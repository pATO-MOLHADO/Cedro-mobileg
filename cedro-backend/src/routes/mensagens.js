const router = require('express').Router();
const mssql  = require('mssql');
const { getPool, sql } = require('../database/connection');
const auth   = require('../middleware/auth');

const CUSTO_MENSAGEM = 1; // 1 crédito por mensagem enviada

// ── GET /api/mensagens/:psicologoId ───────────────────────────────────────────
// Retorna o histórico de chat entre o paciente logado e um psicólogo
router.get('/:psicologoId', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('pac',  sql.Int, req.userId)
      .input('psic', sql.Int, req.params.psicologoId)
      .query(`
        SELECT
          id,
          remetente_id    AS remetenteId,
          mensagem        AS conteudo,    -- aliás para manter compatibilidade com o mobile
          data_criacao    AS dataCriacao
        FROM mensagens
        WHERE (remetente_id = @pac    AND destinatario_id = @psic)
           OR (remetente_id = @psic   AND destinatario_id = @pac)
        ORDER BY data_criacao ASC
      `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[mensagens/listar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/mensagens ───────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { psicologoId, conteudo } = req.body;
  if (!psicologoId || !conteudo?.trim())
    return res.status(400).json({ error: 'psicologoId e conteudo são obrigatórios.' });

  const pool = await getPool();
  const transaction = new mssql.Transaction(pool);
  try {
    await transaction.begin();

    // Verifica e desconta crédito
    const r1 = new mssql.Request(transaction);
    const crRes = await r1
      .input('uid', sql.Int, req.userId)
      .query('SELECT saldo FROM creditos WITH (UPDLOCK) WHERE usuario_id = @uid');

    const saldo = parseFloat(crRes.recordset[0]?.saldo ?? 0);
    if (saldo < CUSTO_MENSAGEM) {
      await transaction.rollback();
      return res.status(402).json({ error: 'Saldo insuficiente. Recarregue seus créditos.' });
    }

    const r2 = new mssql.Request(transaction);
    await r2
      .input('uid', sql.Int, req.userId)
      .input('val', sql.Decimal(10,2), CUSTO_MENSAGEM)
      .query('UPDATE creditos SET saldo = saldo - @val WHERE usuario_id = @uid');

    const r3 = new mssql.Request(transaction);
    await r3
      .input('uid', sql.Int,          req.userId)
      .input('val', sql.Decimal(10,2), CUSTO_MENSAGEM)
      .query(`
        INSERT INTO extrato_creditos (usuario_id, tipo, descricao, valor)
        VALUES (@uid, 'debito', 'Mensagem no chat', @val)
      `);

    // Salva a mensagem na tabela mensagens existente
    // coluna é 'mensagem', não 'conteudo'
    const r4 = new mssql.Request(transaction);
    const ins = await r4
      .input('rem',  sql.Int,     req.userId)
      .input('dest', sql.Int,     psicologoId)
      .input('msg',  sql.NVarChar, conteudo.trim())
      .query(`
        INSERT INTO mensagens (remetente_id, destinatario_id, mensagem)
        OUTPUT
          INSERTED.id,
          INSERTED.remetente_id    AS remetenteId,
          INSERTED.mensagem        AS conteudo,
          INSERTED.data_criacao    AS dataCriacao
        VALUES (@rem, @dest, @msg)
      `);

    await transaction.commit();
    return res.status(201).json({ ...ins.recordset[0], enviado: true });
  } catch (err) {
    await transaction.rollback();
    console.error('[mensagens/enviar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
