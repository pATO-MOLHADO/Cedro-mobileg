require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const migrate = require('./database/migrate');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Rotas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/psicologos',  require('./routes/psicologos'));
app.use('/api/sessoes',     require('./routes/sessoes'));
app.use('/api/creditos',    require('./routes/creditos'));
app.use('/api/assinaturas', require('./routes/assinaturas'));
app.use('/api/mensagens',   require('./routes/mensagens'));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString() })
);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ── Inicialização ─────────────────────────────────────────────────────────────
async function start() {
  try {
    await migrate();  // conecta ao SQL Server + cria tabelas mobile + seed
    app.listen(PORT, () => {
      console.log(`\n🌿 Cedro Backend rodando na porta ${PORT}`);
      console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}\n`);
    });
  } catch (err) {
    console.error('[FATAL] Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
