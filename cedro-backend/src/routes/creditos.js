const router = require('express').Router();
const { getPool, sql } = require('../database/connection');
const auth   = require('../middleware/auth');

// ── GET /api/creditos/saldo/:userId ───────────────────────────────────────────
router.get('/saldo/:userId', auth, async (req, res) => {
  if (parseInt(req.params.userId) !== req.userId)
    return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const pool = await getPool();

    // Cria carteira se não existir (usuários antigos do site)
    await pool.request()
      .input('uid', sql.Int, req.userId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM creditos WHERE usuario_id = @uid)
          INSERT INTO creditos (usuario_id, saldo) VALUES (@uid, 0)
      `);

    const result = await pool.request()
      .input('uid', sql.Int, req.userId)
      .query('SELECT saldo FROM creditos WHERE usuario_id = @uid');

    return res.json({ saldo: parseFloat(result.recordset[0]?.saldo ?? 0) });
  } catch (err) {
    console.error('[creditos/saldo]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /api/creditos/extrato/:userId ─────────────────────────────────────────
router.get('/extrato/:userId', auth, async (req, res) => {
  if (parseInt(req.params.userId) !== req.userId)
    return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('uid', sql.Int, req.userId)
      .query(`
        SELECT id, tipo, descricao, valor, data
        FROM extrato_creditos
        WHERE usuario_id = @uid
        ORDER BY data DESC
      `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[creditos/extrato]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/creditos/comprar ────────────────────────────────────────────────
router.post('/comprar', auth, async (req, res) => {
  const { creditos, pacoteId } = req.body;
  if (!creditos || creditos <= 0)
    return res.status(400).json({ error: 'Quantidade de créditos inválida.' });

  const pool = await getPool();
  const transaction = new (require('mssql').Transaction)(pool);
  try {
    await transaction.begin();

    // Garante que a carteira existe
    const req1 = new (require('mssql').Request)(transaction);
    await req1
      .input('uid', sql.Int, req.userId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM creditos WHERE usuario_id = @uid)
          INSERT INTO creditos (usuario_id, saldo) VALUES (@uid, 0)
      `);

    // Adiciona créditos
    const req2 = new (require('mssql').Request)(transaction);
    const upd = await req2
      .input('val', sql.Decimal(10,2), creditos)
      .input('uid', sql.Int,           req.userId)
      .query(`
        UPDATE creditos
        SET saldo = saldo + @val
        OUTPUT INSERTED.saldo
        WHERE usuario_id = @uid
      `);

    // Registra extrato
    const req3 = new (require('mssql').Request)(transaction);
    await req3
      .input('uid',  sql.Int,          req.userId)
      .input('desc', sql.VarChar,      `Recarga avulsa (${creditos} créditos)`)
      .input('val',  sql.Decimal(10,2), creditos)
      .query(`
        INSERT INTO extrato_creditos (usuario_id, tipo, descricao, valor)
        VALUES (@uid, 'credito', @desc, @val)
      `);

    await transaction.commit();
    return res.json({ saldo: parseFloat(upd.recordset[0].saldo) });
  } catch (err) {
    await transaction.rollback();
    console.error('[creditos/comprar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
