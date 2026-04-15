/**
 * migrate.js
 *
 * IMPORTANTE: As tabelas do site (usuarios, sessoes, mensagens, etc.) já existem.
 * Este script cria APENAS as 3 tabelas novas que o app mobile precisa:
 *   - creditos
 *   - extrato_creditos
 *   - assinaturas
 *
 * Depois popula dados de seed (conta demo + psicólogos) se ainda não existirem.
 */

const { getPool, sql } = require('./connection');
const bcrypt = require('bcryptjs');

async function migrate() {
  const pool = await getPool();

  // ── Tabela: creditos ────────────────────────────────────────────────────────
  await pool.request().query(`
    IF OBJECT_ID('creditos', 'U') IS NULL
    CREATE TABLE creditos (
      usuario_id  INT PRIMARY KEY REFERENCES usuarios(id),
      saldo       DECIMAL(10,2) NOT NULL DEFAULT 0
    );
  `);

  // ── Tabela: extrato_creditos ────────────────────────────────────────────────
  await pool.request().query(`
    IF OBJECT_ID('extrato_creditos', 'U') IS NULL
    CREATE TABLE extrato_creditos (
      id          INT PRIMARY KEY IDENTITY(1,1),
      usuario_id  INT NOT NULL REFERENCES usuarios(id),
      tipo        VARCHAR(10) NOT NULL,         -- 'credito' | 'debito'
      descricao   VARCHAR(255) NOT NULL,
      valor       DECIMAL(10,2) NOT NULL,
      data        DATETIME NOT NULL DEFAULT GETDATE()
    );
  `);

  // ── Tabela: assinaturas ────────────────────────────────────────────────────
  await pool.request().query(`
    IF OBJECT_ID('assinaturas', 'U') IS NULL
    CREATE TABLE assinaturas (
      id          INT PRIMARY KEY IDENTITY(1,1),
      usuario_id  INT NOT NULL REFERENCES usuarios(id),
      plano_id    VARCHAR(50) NOT NULL,
      nome_plano  VARCHAR(100) NOT NULL,
      ativa       BIT NOT NULL DEFAULT 1,
      data_criacao DATETIME NOT NULL DEFAULT GETDATE()
    );
  `);

  console.log('[DB] Tabelas do mobile verificadas/criadas.');
  await seed(pool);
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed(pool) {

  // ── Conta demo (paciente) ──────────────────────────────────────────────────
  const demoCheck = await pool.request()
    .input('email', sql.VarChar, 'demo@cedro.com')
    .query("SELECT id FROM usuarios WHERE email = @email");

  let demoId;

  if (demoCheck.recordset.length === 0) {
    const hash = await bcrypt.hash('123456', 10);
    const ins = await pool.request()
      .input('nome',     sql.VarChar,  'Usuário Demo')
      .input('email',    sql.VarChar,  'demo@cedro.com')
      .input('hash',     sql.VarChar,  hash)
      .input('telefone', sql.VarChar,  '(11) 99999-9999')
      .input('tipo',     sql.VarChar,  'paciente')
      .query(`
        INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo_usuario)
        OUTPUT INSERTED.id
        VALUES (@nome, @email, @hash, @telefone, @tipo)
      `);
    demoId = ins.recordset[0].id;
    console.log('[DB] Conta demo criada (demo@cedro.com / 123456).');
  } else {
    demoId = demoCheck.recordset[0].id;
  }

  // ── Carteira demo ──────────────────────────────────────────────────────────
  const carteiraCheck = await pool.request()
    .input('uid', sql.Int, demoId)
    .query('SELECT usuario_id FROM creditos WHERE usuario_id = @uid');

  if (carteiraCheck.recordset.length === 0) {
    await pool.request()
      .input('uid',   sql.Int,          demoId)
      .input('saldo', sql.Decimal(10,2), 45)
      .query('INSERT INTO creditos (usuario_id, saldo) VALUES (@uid, @saldo)');

    const extratoItems = [
      ['credito', 'Boas-vindas Cedro',         20, new Date(Date.now() - 3  * 86400000)],
      ['debito',  'Sessão com Dr. Carlos',     10, new Date(Date.now() - 7  * 86400000)],
      ['credito', 'Plano Básico semanal',      10, new Date(Date.now() - 10 * 86400000)],
      ['debito',  'Sessão com Dra. Ana',       10, new Date(Date.now() - 14 * 86400000)],
    ];
    for (const [tipo, desc, val, dt] of extratoItems) {
      await pool.request()
        .input('uid',  sql.Int,          demoId)
        .input('tipo', sql.VarChar,      tipo)
        .input('desc', sql.VarChar,      desc)
        .input('val',  sql.Decimal(10,2), val)
        .input('dt',   sql.DateTime,     dt)
        .query(`
          INSERT INTO extrato_creditos (usuario_id, tipo, descricao, valor, data)
          VALUES (@uid, @tipo, @desc, @val, @dt)
        `);
    }
    console.log('[DB] Carteira demo criada (45 créditos).');
  }

  // ── Psicólogos seed ────────────────────────────────────────────────────────
  const psicCount = await pool.request()
    .query("SELECT COUNT(*) AS total FROM usuarios WHERE tipo_usuario = 'psicologo'");

  if (psicCount.recordset[0].total === 0) {
    const hash = await bcrypt.hash('psicologo123', 10);
    const psics = [
      ['Dra. Ana Beatriz Lima',  'ana.beatriz@cedro.com',  'Ansiedade e TCC',     120, 5.0, 'Especialista em Terapia Cognitivo-Comportamental com 8 anos de experiência no tratamento de ansiedade, fobias e transtornos do humor.'],
      ['Dr. Carlos Mendes',      'carlos.mendes@cedro.com','Depressão e Burnout', 100, 4.0, 'Psicólogo clínico com foco em depressão, esgotamento profissional e transições de vida. Abordagem humanista e acolhedora.'],
      ['Dra. Fernanda Rocha',    'fernanda.r@cedro.com',   'Relacionamentos',     110, 5.0, 'Especialista em psicologia relacional e terapia de casal. Atende questões de autoestima, comunicação e vínculos afetivos.'],
      ['Dr. Rafael Souza',       'rafael.souza@cedro.com', 'Trauma e TEPT',        90, 4.0, 'Psicólogo com formação em EMDR e tratamento de trauma. Experiência com vítimas de abuso, acidentes e perdas.'],
      ['Dra. Juliana Costa',     'juliana.costa@cedro.com','Psicologia Infantil', 130, 5.0, 'Especialista em desenvolvimento infantil e adolescente. Atende crianças de 3 a 17 anos com queixas comportamentais e emocionais.'],
      ['Dr. Marcos Alves',       'marcos.alves@cedro.com', 'Mindfulness e MBSR',   95, 4.0, 'Terapeuta com certificação em Mindfulness-Based Stress Reduction. Trabalha redução de estresse e bem-estar no trabalho.'],
    ];
    for (const [nome, email, esp, preco, aval, bio] of psics) {
      await pool.request()
        .input('nome',  sql.VarChar,      nome)
        .input('email', sql.VarChar,      email)
        .input('hash',  sql.VarChar,      hash)
        .input('esp',   sql.VarChar,      esp)
        .input('preco', sql.Decimal(10,2), preco)
        .input('aval',  sql.Decimal(3,2),  aval)
        .input('bio',   sql.Text,          bio)
        .query(`
          INSERT INTO usuarios
            (nome, email, senha_hash, especialidade, preco_sessao, avaliacao, bio, tipo_usuario)
          VALUES
            (@nome, @email, @hash, @esp, @preco, @aval, @bio, 'psicologo')
        `);
    }
    console.log('[DB] Psicólogos de seed inseridos.');
  }

  // ── Sessões demo ───────────────────────────────────────────────────────────
  const sessCount = await pool.request()
    .input('pid', sql.Int, demoId)
    .query('SELECT COUNT(*) AS total FROM sessoes WHERE paciente_id = @pid');

  if (sessCount.recordset[0].total === 0) {
    const psics = await pool.request()
      .query("SELECT TOP 4 id FROM usuarios WHERE tipo_usuario = 'psicologo' ORDER BY id");
    const pids = psics.recordset.map(r => r.id);
    if (pids.length >= 4) {
      const sessoesSeed = [
        [demoId, pids[0], new Date(Date.now() + 2 * 86400000), 60, 132.00, 'agendada'],
        [demoId, pids[1], new Date(Date.now() - 7 * 86400000), 60, 110.00, 'realizada'],
        [demoId, pids[1], new Date(Date.now() -14 * 86400000), 60, 110.00, 'realizada'],
        [demoId, pids[3], new Date(Date.now() -20 * 86400000), 60,  99.00, 'cancelada'],
      ];
      for (const [pacId, psicId, dt, dur, val, st] of sessoesSeed) {
        await pool.request()
          .input('pac',  sql.Int,          pacId)
          .input('psic', sql.Int,          psicId)
          .input('dt',   sql.DateTime,     dt)
          .input('dur',  sql.Int,          dur)
          .input('val',  sql.Decimal(10,2), val)
          .input('st',   sql.VarChar,      st)
          .query(`
            INSERT INTO sessoes (paciente_id, psicologo_id, data_sessao, duracao, valor, status_sessao)
            VALUES (@pac, @psic, @dt, @dur, @val, @st)
          `);
      }
      console.log('[DB] Sessões demo inseridas.');
    }
  }
}

module.exports = migrate;
