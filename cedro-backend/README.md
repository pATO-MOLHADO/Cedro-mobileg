# 🌿 Cedro Backend — SQL Server

API REST para o app mobile Cedro, integrada ao banco SQL Server existente do site web.

**Stack:** Node.js · Express · SQL Server (mssql) · JWT · bcryptjs

---

## 🗄️ Banco de dados

### Tabelas existentes (do site — não alteradas)
| Tabela | Uso no mobile |
|---|---|
| `usuarios` | Pacientes e psicólogos (campo `tipo_usuario`) |
| `sessoes` | Agendamento de consultas |
| `mensagens` | Chat paciente ↔ psicólogo |
| `emergencias` | Registro de emergências |
| `mensagens_emergencia` | Chat de emergência |

### Tabelas novas (criadas pelo mobile)
| Tabela | Descrição |
|---|---|
| `creditos` | Saldo de créditos por paciente |
| `extrato_creditos` | Histórico de débitos e créditos |
| `assinaturas` | Planos de assinatura ativos |

### Executar no SSMS
Abra o arquivo `cedro_mobile_tables.sql` no SSMS e execute.
Ele cria apenas as 3 tabelas novas, sem tocar no restante.

---

## 🚀 Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais SQL Server

# 3. Iniciar (dev)
npm run dev

# 4. Ou produção
npm start
```

### Exemplo de .env (autenticação SQL):
```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=cedro
DB_USER=sa
DB_PASSWORD=sua_senha
JWT_SECRET=string_aleatoria_longa
```

### Autenticação Windows (sem usuário/senha):
```env
DB_SERVER=localhost
DB_DATABASE=cedro
DB_TRUSTED_CONNECTION=true
JWT_SECRET=string_aleatoria_longa
```

---

## 📋 Endpoints

### Auth
| Método | Rota | Auth |
|---|---|---|
| POST | `/api/auth/login` | ❌ |
| POST | `/api/auth/cadastro` | ❌ |
| PUT  | `/api/auth/perfil` | ✅ |

**Resposta do login:**
```json
{
  "token": "eyJ...",
  "usuarioResponse": {
    "id": 1,
    "nome": "Usuário Demo",
    "email": "demo@cedro.com",
    "telefone": "(11) 99999-9999",
    "role": "PACIENTE"
  }
}
```

### Psicólogos (query em `usuarios` WHERE `tipo_usuario = 'psicologo'`)
| Método | Rota | Auth |
|---|---|---|
| GET | `/api/psicologos` | ✅ |
| GET | `/api/psicologos/:id` | ✅ |

### Sessões
| Método | Rota | Auth |
|---|---|---|
| GET   | `/api/sessoes/paciente/:userId` | ✅ |
| POST  | `/api/sessoes` | ✅ |
| PATCH | `/api/sessoes/:id/cancelar` | ✅ |

### Créditos
| Método | Rota | Auth |
|---|---|---|
| GET  | `/api/creditos/saldo/:userId` | ✅ |
| GET  | `/api/creditos/extrato/:userId` | ✅ |
| POST | `/api/creditos/comprar` | ✅ |

### Assinaturas
| Método | Rota | Auth |
|---|---|---|
| GET  | `/api/assinaturas/ativa/:userId` | ✅ |
| POST | `/api/assinaturas` | ✅ |

### Mensagens (usa tabela `mensagens` existente)
| Método | Rota | Auth |
|---|---|---|
| GET  | `/api/mensagens/:psicologoId` | ✅ |
| POST | `/api/mensagens` | ✅ |

> Cada mensagem enviada consome **1 crédito**. Retorna `402` se saldo insuficiente.

### Health Check
```
GET /health → { "status": "ok" }
```

---

## 💰 Créditos iniciais ao assinar plano
| Plano | Créditos |
|---|---|
| Básico | 10 |
| Premium | 20 |
| Anual | 15 |

---

## 👤 Conta demo (seed automático no 1º start)
| | |
|---|---|
| Email | `demo@cedro.com` |
| Senha | `123456` |
| Saldo | 45 créditos |

O seed só roda se a conta ainda não existir no banco.
