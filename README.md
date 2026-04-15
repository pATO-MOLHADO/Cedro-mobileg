# 📱 Cedro Mobile

App mobile do projeto **Cedro** — plataforma de apoio psicológico digital.
Desenvolvido com **React Native + Expo SDK 53** (compatível com Expo Go atual).

---

## 🚀 Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar
npm start

# 3. Escanear o QR Code com Expo Go no celular
```

### Conta demo (funciona offline)
```
Email:  demo@cedro.com
Senha:  123456
```

---

## 🛠️ Correções aplicadas nesta versão

| Problema | Solução |
|---|---|
| SDK 52 incompatível com Expo Go | Atualizado para SDK 53 |
| `main` errado no package.json | Corrigido para `index.js` |
| `api.js` e `theme/index.js` ausentes | Criados do zero |
| Login travava sem backend | Mock automático + conta demo |
| Placeholders sem funcionalidade | Telas completas: Agendar, Planos, Chat, Extrato |
| Imports de paths quebrados | Todos os paths corrigidos |
| `react-native-gesture-handler` faltando | Adicionado ao package.json |

---

## 📁 Estrutura

```
cedro-mobile/
├── index.js                      # Entry point (registerRootComponent)
├── App.js                        # Root component
├── app.json                      # Expo config (SDK 53)
├── package.json
├── babel.config.js
└── src/
    ├── contexts/
    │   └── AuthContext.js
    ├── navigation/
    │   └── index.js
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── CadastroScreen.js
    │   ├── HomeScreen.js
    │   ├── PsicologosScreen.js
    │   ├── PsicologoDetailScreen.js
    │   ├── CreditosScreen.js
    │   ├── SessoesScreen.js
    │   ├── PerfilScreen.js
    │   ├── EmergenciaScreen.js
    │   ├── ChatPsicologoScreen.js
    │   ├── AgendarSessaoScreen.js
    │   ├── PlanosScreen.js
    │   └── ExtratoScreen.js
    ├── components/
    │   └── EmergencyButton.js
    ├── services/
    │   └── api.js                # Axios + mock automático
    └── theme/
        └── index.js
```

---

## 🗺️ Telas

| Tela | Status | Descrição |
|---|---|---|
| Login | ✅ Completo | Email + senha + conta demo |
| Cadastro | ✅ Completo | Auto-login após cadastro |
| Home | ✅ Completo | Saldo, próxima sessão, acesso rápido |
| Psicólogos | ✅ Completo | Lista + busca + preço +10% |
| Perfil psicólogo | ✅ Completo | Detalhes, agendar, chat |
| Créditos | ✅ Completo | Planos + compra avulsa + extrato |
| Sessões | ✅ Completo | Histórico + filtros + cancelar |
| Perfil | ✅ Completo | Dados editáveis + logout |
| Emergência | ✅ Completo | Chat bot 24h gratuito |
| Chat psicólogo | ✅ Completo | Mensagens em tempo real |
| Agendar sessão | ✅ Completo | Calendário + horários |
| Planos | ✅ Completo | Confirmação de assinatura |
| Extrato | ✅ Completo | Histórico de créditos |

---

## 🔗 Backend

- **Produção**: `https://cedro-backend-tsyg.onrender.com`
- **Auth**: JWT via `Authorization: Bearer <token>`
- **Offline**: Mock automático — o app funciona completamente sem backend

---

## 💰 Sistema de Créditos

- Saldo exibido na Home e na tela de Créditos
- Compra avulsa: 5, 10, 20 ou 50 créditos
- Planos: Básico (R$49,90), Premium (R$89,90), Anual (R$599,90)
- Chat com psicólogo consome créditos
- Emergência é **gratuita**
- Preço ao paciente = `preço do psicólogo × 1.10`
