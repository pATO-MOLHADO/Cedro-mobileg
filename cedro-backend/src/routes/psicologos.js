const router = require('express').Router();
const { getPool, sql } = require('../database/connection');
const auth   = require('../middleware/auth');

const SELECT_PSIC = `
  SELECT
    id,
    nome,
    especialidade,
    preco_sessao  AS precoSessao,
    avaliacao,
    bio
  FROM usuarios
  WHERE tipo_usuario = 'psicologo' AND ativo = 1
`;

// ── GET /api/psicologos ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`${SELECT_PSIC} ORDER BY avaliacao DESC, nome ASC`);
    return res.json(result.recordset);
  } catch (err) {
    console.error('[psicologos/listar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /api/psicologos/:id ───────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT
          id,
          nome,
          especialidade,
          preco_sessao AS precoSessao,
          avaliacao,
          bio
        FROM usuarios
        WHERE id = @id AND tipo_usuario = 'psicologo' AND ativo = 1
      `);
    if (!result.recordset[0])
      return res.status(404).json({ error: 'Psicólogo não encontrado.' });
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('[psicologos/buscar]', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
