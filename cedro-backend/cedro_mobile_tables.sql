
-- ============================================================
--  cedro_banco_completo.sql
--  Banco de dados completo do projeto Cedro (site + mobile)
--
--  Execute no SSMS:
--    1. Conecte ao seu SQL Server
--    2. Abra este arquivo
--    3. Execute tudo (F5)
--
--  O script é idempotente: pode rodar várias vezes sem erro.
--  Senha demo:       demo@cedro.com   / 123456
--  Senha psicólogos: <email>          / psicologo123
-- ============================================================

-- ── Cria o banco se não existir ───────────────────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'cedro')
BEGIN
    CREATE DATABASE cedromobile;
    PRINT '✅ Banco "cedro" criado.';
END
GO

USE cedromobile;
GO

-- ==============================================================
--  TABELAS PRINCIPAIS
-- ==============================================================

-- ── 1. usuarios ───────────────────────────────────────────────
--  Pacientes, psicólogos e admins num único registro.
--  tipo_usuario: 'paciente' | 'psicologo' | 'admin'
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE usuarios (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        nome            NVARCHAR(150)   NOT NULL,
        email           VARCHAR(200)    NOT NULL UNIQUE,
        senha_hash      VARCHAR(255)    NOT NULL,
        telefone        VARCHAR(20)     NULL,
        tipo_usuario    VARCHAR(20)     NOT NULL DEFAULT 'paciente'
                                        CHECK (tipo_usuario IN ('paciente', 'psicologo', 'admin')),
        -- campos exclusivos de psicólogo (NULL para pacientes)
        especialidade   NVARCHAR(100)   NULL,
        preco_sessao    DECIMAL(10,2)   NULL,
        avaliacao       DECIMAL(3,2)    NULL,
        bio             NVARCHAR(MAX)   NULL,
        -- controle
        ativo           BIT             NOT NULL DEFAULT 1,
        criado_em       DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_usuarios_email ON usuarios(email);
    CREATE INDEX idx_usuarios_tipo  ON usuarios(tipo_usuario);
    PRINT '✅ Tabela usuarios criada.';
END
ELSE
    PRINT '⚠️  Tabela usuarios já existe — ignorada.';
GO

-- ── 2. sessoes ────────────────────────────────────────────────
--  Agendamentos de consultas entre paciente e psicólogo.
--  status_sessao: 'agendada' | 'realizada' | 'cancelada'
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sessoes', 'U') IS NULL
BEGIN
    CREATE TABLE sessoes (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        paciente_id     INT             NOT NULL REFERENCES usuarios(id),
        psicologo_id    INT             NULL     REFERENCES usuarios(id),
        data_sessao     DATETIME        NOT NULL,
        duracao         INT             NOT NULL DEFAULT 60,   -- minutos
        valor           DECIMAL(10,2)   NOT NULL,
        status_sessao   VARCHAR(20)     NOT NULL DEFAULT 'agendada'
                                        CHECK (status_sessao IN ('agendada','realizada','cancelada')),
        criado_em       DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_sessoes_paciente   ON sessoes(paciente_id);
    CREATE INDEX idx_sessoes_psicologo  ON sessoes(psicologo_id);
    CREATE INDEX idx_sessoes_data       ON sessoes(data_sessao);
    PRINT '✅ Tabela sessoes criada.';
END
ELSE
    PRINT '⚠️  Tabela sessoes já existe — ignorada.';
GO

-- ── 3. mensagens ─────────────────────────────────────────────
--  Chat direto entre paciente e psicólogo.
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('mensagens', 'U') IS NULL
BEGIN
    CREATE TABLE mensagens (
        id                  INT             PRIMARY KEY IDENTITY(1,1),
        remetente_id        INT             NOT NULL REFERENCES usuarios(id),
        destinatario_id     INT             NOT NULL REFERENCES usuarios(id),
        mensagem            NVARCHAR(MAX)   NOT NULL,
        lida                BIT             NOT NULL DEFAULT 0,
        data_criacao        DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_mensagens_remetente    ON mensagens(remetente_id);
    CREATE INDEX idx_mensagens_destinatario ON mensagens(destinatario_id);
    PRINT '✅ Tabela mensagens criada.';
END
ELSE
    PRINT '⚠️  Tabela mensagens já existe — ignorada.';
GO

-- ── 4. emergencias ───────────────────────────────────────────
--  Registro de acionamentos do botão de emergência.
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('emergencias', 'U') IS NULL
BEGIN
    CREATE TABLE emergencias (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        usuario_id      INT             NOT NULL REFERENCES usuarios(id),
        data_inicio     DATETIME        NOT NULL DEFAULT GETDATE(),
        data_fim        DATETIME        NULL,
        encerrada       BIT             NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_emergencias_usuario ON emergencias(usuario_id);
    PRINT '✅ Tabela emergencias criada.';
END
ELSE
    PRINT '⚠️  Tabela emergencias já existe — ignorada.';
GO

-- ── 5. mensagens_emergencia ───────────────────────────────────
--  Chat do bot de emergência 24h (gratuito).
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('mensagens_emergencia', 'U') IS NULL
BEGIN
    CREATE TABLE mensagens_emergencia (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        emergencia_id   INT             NOT NULL REFERENCES emergencias(id),
        remetente       VARCHAR(10)     NOT NULL CHECK (remetente IN ('usuario','bot')),
        mensagem        NVARCHAR(MAX)   NOT NULL,
        data_criacao    DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_msg_emerg_emergencia ON mensagens_emergencia(emergencia_id);
    PRINT '✅ Tabela mensagens_emergencia criada.';
END
ELSE
    PRINT '⚠️  Tabela mensagens_emergencia já existe — ignorada.';
GO

-- ==============================================================
--  TABELAS MOBILE (novas)
-- ==============================================================

-- ── 6. creditos ───────────────────────────────────────────────
--  Saldo de créditos de cada paciente.
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('creditos', 'U') IS NULL
BEGIN
    CREATE TABLE creditos (
        usuario_id      INT             PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
        saldo           DECIMAL(10,2)   NOT NULL DEFAULT 0
                                        CHECK (saldo >= 0)
    );
    PRINT '✅ Tabela creditos criada.';
END
ELSE
    PRINT '⚠️  Tabela creditos já existe — ignorada.';
GO

-- ── 7. extrato_creditos ───────────────────────────────────────
--  Histórico de todas as movimentações de crédito.
--  tipo: 'credito' (entrada) | 'debito' (saída)
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('extrato_creditos', 'U') IS NULL
BEGIN
    CREATE TABLE extrato_creditos (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        usuario_id      INT             NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo            VARCHAR(10)     NOT NULL CHECK (tipo IN ('credito','debito')),
        descricao       NVARCHAR(255)   NOT NULL,
        valor           DECIMAL(10,2)   NOT NULL,
        data            DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_extrato_usuario ON extrato_creditos(usuario_id);
    CREATE INDEX idx_extrato_data    ON extrato_creditos(data);
    PRINT '✅ Tabela extrato_creditos criada.';
END
ELSE
    PRINT '⚠️  Tabela extrato_creditos já existe — ignorada.';
GO

-- ── 8. assinaturas ────────────────────────────────────────────
--  Planos de assinatura dos pacientes.
--  plano_id: 'basico' | 'premium' | 'anual'
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('assinaturas', 'U') IS NULL
BEGIN
    CREATE TABLE assinaturas (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        usuario_id      INT             NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        plano_id        VARCHAR(50)     NOT NULL CHECK (plano_id IN ('basico','premium','anual')),
        nome_plano      NVARCHAR(100)   NOT NULL,
        ativa           BIT             NOT NULL DEFAULT 1,
        data_criacao    DATETIME        NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX idx_assinaturas_usuario ON assinaturas(usuario_id);
    PRINT '✅ Tabela assinaturas criada.';
END
ELSE
    PRINT '⚠️  Tabela assinaturas já existe — ignorada.';
GO

-- ==============================================================
--  SEED — DADOS INICIAIS
--  (só insere se ainda não existirem)
-- ==============================================================

-- ── Psicólogos ────────────────────────────────────────────────
--  Senha: psicologo123
--  Hash bcrypt gerado externamente (cost 10):
DECLARE @hashPsic VARCHAR(255) = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy';

IF NOT EXISTS (SELECT 1 FROM usuarios WHERE tipo_usuario = 'psicologo')
BEGIN
    INSERT INTO usuarios (nome, email, senha_hash, especialidade, preco_sessao, avaliacao, bio, tipo_usuario) VALUES
    (
        'Dra. Ana Beatriz Lima',
        'ana.beatriz@cedro.com',
        @hashPsic,
        'Ansiedade e TCC',
        120.00, 5.0,
        'Especialista em Terapia Cognitivo-Comportamental com 8 anos de experiência no tratamento de ansiedade, fobias e transtornos do humor.',
        'psicologo'
    ),
    (
        'Dr. Carlos Mendes',
        'carlos.mendes@cedro.com',
        @hashPsic,
        'Depressão e Burnout',
        100.00, 4.0,
        'Psicólogo clínico com foco em depressão, esgotamento profissional e transições de vida. Abordagem humanista e acolhedora.',
        'psicologo'
    ),
    (
        'Dra. Fernanda Rocha',
        'fernanda.r@cedro.com',
        @hashPsic,
        'Relacionamentos',
        110.00, 5.0,
        'Especialista em psicologia relacional e terapia de casal. Atende questões de autoestima, comunicação e vínculos afetivos.',
        'psicologo'
    ),
    (
        'Dr. Rafael Souza',
        'rafael.souza@cedro.com',
        @hashPsic,
        'Trauma e TEPT',
        90.00, 4.0,
        'Psicólogo com formação em EMDR e tratamento de trauma. Experiência com vítimas de abuso, acidentes e perdas.',
        'psicologo'
    ),
    (
        'Dra. Juliana Costa',
        'juliana.costa@cedro.com',
        @hashPsic,
        'Psicologia Infantil',
        130.00, 5.0,
        'Especialista em desenvolvimento infantil e adolescente. Atende crianças de 3 a 17 anos com queixas comportamentais e emocionais.',
        'psicologo'
    ),
    (
        'Dr. Marcos Alves',
        'marcos.alves@cedro.com',
        @hashPsic,
        'Mindfulness e MBSR',
        95.00, 4.0,
        'Terapeuta com certificação em Mindfulness-Based Stress Reduction. Trabalha redução de estresse e bem-estar no trabalho.',
        'psicologo'
    );
    PRINT '✅ Psicólogos inseridos.';
END
ELSE
    PRINT '⚠️  Psicólogos já existem — ignorados.';
GO

-- ── Usuário demo (paciente) ───────────────────────────────────
--  Email: demo@cedro.com  /  Senha: 123456
--  Hash bcrypt (cost 10):
DECLARE @hashDemo VARCHAR(255) = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
DECLARE @demoId INT;

IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'demo@cedro.com')
BEGIN
    INSERT INTO usuarios (nome, email, senha_hash, telefone, tipo_usuario)
    VALUES ('Usuário Demo', 'demo@cedro.com', @hashDemo, '(11) 99999-9999', 'paciente');

    SET @demoId = SCOPE_IDENTITY();
    PRINT '✅ Conta demo criada (demo@cedro.com / 123456).';
END
ELSE
BEGIN
    SELECT @demoId = id FROM usuarios WHERE email = 'demo@cedro.com';
    PRINT '⚠️  Conta demo já existe — usando id existente.';
END
GO

-- ── Carteira demo (45 créditos) ───────────────────────────────
DECLARE @demoId2 INT;
SELECT @demoId2 = id FROM usuarios WHERE email = 'demo@cedro.com';

IF NOT EXISTS (SELECT 1 FROM creditos WHERE usuario_id = @demoId2)
BEGIN
    INSERT INTO creditos (usuario_id, saldo) VALUES (@demoId2, 45.00);

    INSERT INTO extrato_creditos (usuario_id, tipo, descricao, valor, data) VALUES
    (@demoId2, 'credito', 'Boas-vindas Cedro',        20.00, DATEADD(day, -3,  GETDATE())),
    (@demoId2, 'debito',  'Sessão com Dr. Carlos',    10.00, DATEADD(day, -7,  GETDATE())),
    (@demoId2, 'credito', 'Plano Básico semanal',     10.00, DATEADD(day, -10, GETDATE())),
    (@demoId2, 'debito',  'Sessão com Dra. Ana',      10.00, DATEADD(day, -14, GETDATE())),
    (@demoId2, 'credito', 'Recarga avulsa',           35.00, DATEADD(day, -17, GETDATE()));

    PRINT '✅ Carteira demo criada (45 créditos + extrato).';
END
ELSE
    PRINT '⚠️  Carteira demo já existe — ignorada.';
GO

-- ── Sessões demo ──────────────────────────────────────────────
DECLARE @demoId3  INT;
DECLARE @psic1Id  INT;
DECLARE @psic2Id  INT;
DECLARE @psic4Id  INT;

SELECT @demoId3 = id FROM usuarios WHERE email = 'demo@cedro.com';
SELECT @psic1Id = id FROM usuarios WHERE email = 'ana.beatriz@cedro.com';
SELECT @psic2Id = id FROM usuarios WHERE email = 'carlos.mendes@cedro.com';
SELECT @psic4Id = id FROM usuarios WHERE email = 'rafael.souza@cedro.com';

IF NOT EXISTS (SELECT 1 FROM sessoes WHERE paciente_id = @demoId3)
  AND @psic1Id IS NOT NULL
  AND @psic2Id IS NOT NULL
  AND @psic4Id IS NOT NULL
BEGIN
    INSERT INTO sessoes (paciente_id, psicologo_id, data_sessao, duracao, valor, status_sessao) VALUES
    (@demoId3, @psic1Id, DATEADD(day,  2, GETDATE()), 60, 132.00, 'agendada'),
    (@demoId3, @psic2Id, DATEADD(day, -7, GETDATE()), 60, 110.00, 'realizada'),
    (@demoId3, @psic2Id, DATEADD(day,-14, GETDATE()), 60, 110.00, 'realizada'),
    (@demoId3, @psic4Id, DATEADD(day,-20, GETDATE()), 60,  99.00, 'cancelada');
    PRINT '✅ Sessões demo inseridas.';
END
ELSE
    PRINT '⚠️  Sessões demo já existem ou psicólogos não encontrados — ignoradas.';
GO

-- ==============================================================
PRINT '';
PRINT '🌿 ============================================';
PRINT '   Banco Cedro configurado com sucesso!';
PRINT '   Conta demo:  demo@cedro.com  /  123456';
PRINT '   Psicólogos:  <email>  /  psicologo123';
PRINT '🌿 ============================================';
GO