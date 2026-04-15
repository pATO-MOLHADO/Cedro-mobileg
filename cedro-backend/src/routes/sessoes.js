const router = require('express').Router();
const { getPool, sql } = require('../database/connection');
const auth   = require('../middleware/auth');

// ── GET /api/sessoes/paciente/:userId ─────────────────────────────────────────
router.get('/paciente/:userId', auth, async (req, res) => {
  if (parseInt(req.params.userId) !== req.userId)
    return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const pool = await getPool();
    // JOIN com usuarios para retornar o nome do psicólogo
    const result = await pool.request()
      .input('pid', sql.Int, req.userId)
      .query(`
        SELECT
          s.id,
          s.data_sessao    AS dataSessao,
          s.duracao,
          s.valor,
          s.status_sessao  AS statusSessao,
          s.psicologo_id   AS psicologoId,
          u.nome           AS psicologoNome
        FROM sessoes s
        LEFT JOIN usuarios u ON u.id = s.psicologo_id
        WHERE s.paciente_id = @pid
        ORDER BY s.data_sessao DESC
      `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[sessoes/listar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── POST /api/sessoes ─────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { pacienteId, psicologoId, dataSessao, duracao, valor } = req.body;

  if (!dataSessao || !valor)
    return res.status(400).json({ error: 'dataSessao e valor são obrigatórios.' });
  if (pacienteId && parseInt(pacienteId) !== req.userId)
    return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const pool = await getPool();
    const ins = await pool.request()
      .input('pac',  sql.Int,          req.userId)
      .input('psic', sql.Int,          psicologoId || null)
      .input('dt',   sql.DateTime,     new Date(dataSessao))
      .input('dur',  sql.Int,          duracao || 60)
      .input('val',  sql.Decimal(10,2), parseFloat(valor))
      .query(`
        INSERT INTO sessoes (paciente_id, psicologo_id, data_sessao, duracao, valor, status_sessao)
        OUTPUT INSERTED.id,
               INSERTED.data_sessao   AS dataSessao,
               INSERTED.duracao,
               INSERTED.valor,
               INSERTED.status_sessao AS statusSessao,
               INSERTED.psicologo_id  AS psicologoId
        VALUES (@pac, @psic, @dt, @dur, @val, 'agendada')
      `);

    const sessao = ins.recordset[0];

    // Busca o nome do psicólogo separadamente para retornar ao mobile
    if (sessao.psicologoId) {
      const psic = await pool.request()
        .input('id', sql.Int, sessao.psicologoId)
        .query('SELECT nome FROM usuarios WHERE id = @id');
      sessao.psicologoNome = psic.recordset[0]?.nome || null;
    }

    return res.status(201).json(sessao);
  } catch (err) {
    console.error('[sessoes/agendar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PATCH /api/sessoes/:id/cancelar ──────────────────────────────────────────
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const check = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT id, status_sessao, paciente_id FROM sessoes WHERE id = @id');

    const sessao = check.recordset[0];
    if (!sessao)
      return res.status(404).json({ error: 'Sessão não encontrada.' });
    if (sessao.paciente_id !== req.userId)
      return res.status(403).json({ error: 'Acesso negado.' });
    if (sessao.status_sessao !== 'agendada')
      return res.status(400).json({ error: 'Apenas sessões agendadas podem ser canceladas.' });

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query("UPDATE sessoes SET status_sessao = 'cancelada' WHERE id = @id");

    return res.json({ ok: true });
  } catch (err) {
    console.error('[sessoes/cancelar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
