import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = 'https://cedro-backend-tsyg.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ─── Mock data (usado quando o backend está offline) ──────────────────────────
const MOCK_USER = {
  id: 1,
  nome: 'Usuário Demo',
  email: 'demo@cedro.com',
  telefone: '(11) 99999-9999',
  role: 'PACIENTE',
};

const MOCK_TOKEN = 'mock_jwt_token_cedro_demo';

const MOCK_PSICOLOGOS = [
  { id: 1, nome: 'Dra. Ana Beatriz Lima',    especialidade: 'Ansiedade e TCC',       precoSessao: 120, avaliacao: 5, bio: 'Especialista em Terapia Cognitivo-Comportamental com 8 anos de experiência no tratamento de ansiedade, fobias e transtornos do humor.' },
  { id: 2, nome: 'Dr. Carlos Mendes',        especialidade: 'Depressão e Burnout',   precoSessao: 100, avaliacao: 4, bio: 'Psicólogo clínico com foco em depressão, esgotamento profissional e transições de vida. Abordagem humanista e acolhedora.' },
  { id: 3, nome: 'Dra. Fernanda Rocha',      especialidade: 'Relacionamentos',       precoSessao: 110, avaliacao: 5, bio: 'Especialista em psicologia relacional e terapia de casal. Atende questões de autoestima, comunicação e vínculos afetivos.' },
  { id: 4, nome: 'Dr. Rafael Souza',         especialidade: 'Trauma e TEPT',         precoSessao:  90, avaliacao: 4, bio: 'Psicólogo com formação em EMDR e tratamento de trauma. Experiência com vítimas de abuso, acidentes e perdas.' },
  { id: 5, nome: 'Dra. Juliana Costa',       especialidade: 'Psicologia Infantil',   precoSessao: 130, avaliacao: 5, bio: 'Especialista em desenvolvimento infantil e adolescente. Atende crianças de 3 a 17 anos com queixas comportamentais e emocionais.' },
  { id: 6, nome: 'Dr. Marcos Alves',         especialidade: 'Mindfulness e MBSR',    precoSessao:  95, avaliacao: 4, bio: 'Terapeuta com certificação em Mindfulness-Based Stress Reduction. Trabalha redução de estresse e bem-estar no trabalho.' },
];

const MOCK_SESSOES = [
  { id: 1, dataSessao: new Date(Date.now() + 2 * 24 * 3600000).toISOString(), duracao: 60, valor: 132.00, statusSessao: 'agendada',  psicologoNome: 'Dra. Ana Beatriz Lima' },
  { id: 2, dataSessao: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), duracao: 60, valor: 110.00, statusSessao: 'realizada', psicologoNome: 'Dr. Carlos Mendes' },
  { id: 3, dataSessao: new Date(Date.now() - 14* 24 * 3600000).toISOString(), duracao: 60, valor: 110.00, statusSessao: 'realizada', psicologoNome: 'Dr. Carlos Mendes' },
  { id: 4, dataSessao: new Date(Date.now() - 20* 24 * 3600000).toISOString(), duracao: 60, valor:  99.00, statusSessao: 'cancelada', psicologoNome: 'Dr. Rafael Souza' },
];

let mockSaldo = 45;
let mockSessoes = [...MOCK_SESSOES];

// ─── Helper: tenta real, cai no mock ─────────────────────────────────────────
async function tryOrMock(realFn, mockResult) {
  try {
    return await realFn();
  } catch (err) {
    // Se for erro de auth (401/403) relança
    if (err.response?.status === 401 || err.response?.status === 403) throw err;
    // Timeout / rede offline → retorna mock
    console.warn('[API] Usando mock:', err.message);
    return { data: mockResult };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  async login(email, senha) {
    // Aceita credenciais demo sem backend
    if (email.trim().toLowerCase() === 'demo@cedro.com' && senha === '123456') {
      return { data: { usuarioResponse: MOCK_USER, token: MOCK_TOKEN } };
    }
    return api.post('/api/auth/login', { email: email.trim(), senha });
  },

  async register(form) {
    return tryOrMock(
      () => api.post('/api/auth/cadastro', form),
      { ...MOCK_USER, nome: form.nome, email: form.email, telefone: form.telefone }
    );
  },

  async updatePerfil(form) {
    return tryOrMock(
      () => api.put('/api/auth/perfil', form),
      { ...MOCK_USER, ...form }
    );
  },
};

// ─── Psicólogos ───────────────────────────────────────────────────────────────
export const psicologosService = {
  async listar() {
    return tryOrMock(
      () => api.get('/api/psicologos'),
      MOCK_PSICOLOGOS
    );
  },

  async buscar(id) {
    return tryOrMock(
      () => api.get(`/api/psicologos/${id}`),
      MOCK_PSICOLOGOS.find(p => p.id === id) ?? MOCK_PSICOLOGOS[0]
    );
  },
};

// ─── Sessões ──────────────────────────────────────────────────────────────────
export const sessoesService = {
  async minhasSessoes(userId) {
    return tryOrMock(
      () => api.get(`/api/sessoes/paciente/${userId}`),
      mockSessoes
    );
  },

  async agendar(payload) {
    return tryOrMock(
      () => api.post('/api/sessoes', payload),
      (() => {
        const nova = {
          id: Date.now(),
          dataSessao: payload.dataSessao,
          duracao: 60,
          valor: payload.valor ?? 110,
          statusSessao: 'agendada',
          psicologoNome: payload.psicologoNome ?? 'Psicólogo',
        };
        mockSessoes = [nova, ...mockSessoes];
        return nova;
      })()
    );
  },

  async cancelar(sessaoId) {
    return tryOrMock(
      () => api.patch(`/api/sessoes/${sessaoId}/cancelar`),
      (() => {
        mockSessoes = mockSessoes.map(s =>
          s.id === sessaoId ? { ...s, statusSessao: 'cancelada' } : s
        );
        return { ok: true };
      })()
    );
  },
};

// ─── Créditos ─────────────────────────────────────────────────────────────────
export const creditosService = {
  async saldo(userId) {
    return tryOrMock(
      () => api.get(`/api/creditos/saldo/${userId}`),
      { saldo: mockSaldo }
    );
  },

  async extrato(userId) {
    return tryOrMock(
      () => api.get(`/api/creditos/extrato/${userId}`),
      [
        { id: 1, tipo: 'credito',  descricao: 'Recarga avulsa',     valor: 20, data: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: 2, tipo: 'debito',   descricao: 'Sessão com Dr. Carlos', valor: -10, data: new Date(Date.now() - 7 * 86400000).toISOString() },
        { id: 3, tipo: 'credito',  descricao: 'Plano Básico semanal', valor: 10, data: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 4, tipo: 'debito',   descricao: 'Sessão com Dra. Ana',  valor: -10, data: new Date(Date.now() - 14 * 86400000).toISOString() },
      ]
    );
  },

  async comprar(pacote) {
    return tryOrMock(
      () => api.post('/api/creditos/comprar', pacote),
      (() => {
        mockSaldo += pacote.creditos;
        return { saldo: mockSaldo };
      })()
    );
  },

  async assinaturaAtiva(userId) {
    return tryOrMock(
      () => api.get(`/api/assinaturas/ativa/${userId}`),
      null // sem assinatura ativa por padrão no mock
    );
  },

  async assinar(plano) {
    return tryOrMock(
      () => api.post('/api/assinaturas', plano),
      { nomePlano: plano.nome, ativa: true }
    );
  },
};

// ─── Mensagens ────────────────────────────────────────────────────────────────
export const mensagensService = {
  async listar(psicologoId) {
    return tryOrMock(
      () => api.get(`/api/mensagens/${psicologoId}`),
      []
    );
  },

  async enviar(psicologoId, conteudo) {
    return tryOrMock(
      () => api.post('/api/mensagens', { psicologoId, conteudo }),
      { id: Date.now(), conteudo, enviado: true }
    );
  },
};

export default api;
