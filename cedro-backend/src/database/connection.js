const sql = require('mssql');

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'cedro',
  options: {
    encrypt:                false, // true somente para Azure
    trustServerCertificate: true,  // necessário para servidores locais / auto-assinados
    enableArithAbort:       true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Autenticação: Windows (Trusted) ou SQL Server (usuário/senha)
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user     = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('[DB] Conectado ao SQL Server:', process.env.DB_DATABASE || 'cedro');
  }
  return pool;
}

module.exports = { getPool, sql };
