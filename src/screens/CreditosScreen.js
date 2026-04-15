import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { creditosService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';

const PLANOS = [
  { id: 'basico',  nome: 'Básico',   preco: 'R$ 49,90', rec: '10 créditos/semana', beneficios: ['10 créditos toda semana', 'Chat com psicólogos', 'Suporte por email'], destaque: false, cor: '#3b82f6' },
  { id: 'premium', nome: 'Premium',  preco: 'R$ 89,90', rec: '20 créditos/dia',    beneficios: ['20 créditos todo dia', 'Chat ilimitado', 'Agendamento prioritário', 'Desconto em sessões', 'Suporte 24h'], destaque: true, cor: '#1a6b47' },
  { id: 'anual',   nome: 'Anual',    preco: 'R$ 599,90', rec: '15 créditos/semana', beneficios: ['15 créditos toda semana', 'Todos os benefícios Premium', '2 meses grátis'], destaque: false, cor: '#f97316' },
];

const PACOTES = [
  { id: 'p5',  creditos: 5,  preco: 'R$ 14,90', popular: false },
  { id: 'p10', creditos: 10, preco: 'R$ 24,90', popular: true },
  { id: 'p20', creditos: 20, preco: 'R$ 44,90', popular: false },
  { id: 'p50', creditos: 50, preco: 'R$ 99,90', popular: false },
];

export default function CreditosScreen({ navigation }) {
  const { user }   = useAuth();
  const { colors, isDark, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
  const insets     = useSafeAreaInsets();
  const [saldo, setSaldo]           = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, aRes] = await Promise.allSettled([
        creditosService.saldo(user?.id),
        creditosService.assinaturaAtiva(user?.id),
      ]);
      if (cRes.status === 'fulfilled') setSaldo(cRes.value.data?.saldo ?? 0);
      if (aRes.status === 'fulfilled') setAssinatura(aRes.value.data);
    } catch (_) {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleComprar = (pacote) => {
    Alert.alert(
      `Comprar ${pacote.creditos} créditos`,
      `Valor: ${pacote.preco}\n\nIntegração com pagamento em desenvolvimento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar (Demo)',
          onPress: async () => {
            try {
              const { data } = await creditosService.comprar({ creditos: pacote.creditos, pacoteId: pacote.id });
              setSaldo(data?.saldo ?? (saldo + pacote.creditos));
              Alert.alert('✅ Compra realizada!', `+${pacote.creditos} créditos adicionados.`);
            } catch (_) {
              Alert.alert('Erro', 'Não foi possível completar a compra.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={[s.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={s.headerTitle}>Créditos</Text>
          <View style={s.saldoBox}>
            <View>
              <Text style={s.saldoLabel}>Saldo disponível</Text>
              <Text style={s.saldoValue}>{saldo ?? 0}</Text>
              <Text style={s.saldoUnit}>créditos</Text>
            </View>
            <TouchableOpacity style={s.extratoBtn} onPress={() => navigation.navigate('Extrato')}>
              <Ionicons name="receipt-outline" size={18} color={colors.white} />
              <Text style={s.extratoBtnText}>Ver extrato</Text>
            </TouchableOpacity>
          </View>
          {assinatura ? (
            <View style={s.assinaturaBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={s.assinaturaText}>Plano {assinatura.nomePlano} ativo</Text>
            </View>
          ) : (
            <View style={s.assinaturaBadge}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={[s.assinaturaText, { color: 'rgba(255,255,255,0.6)' }]}>Sem assinatura ativa</Text>
            </View>
          )}
        </LinearGradient>

        <View style={s.body}>
          {/* Compra avulsa */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Compra avulsa</Text>
            <Text style={s.sectionSub}>Sem mensalidade, pague só o que precisar</Text>
            <View style={s.pacotesGrid}>
              {PACOTES.map(pacote => (
                <TouchableOpacity
                  key={pacote.id}
                  style={[s.pacoteCard, pacote.popular && s.pacoteCardPopular]}
                  onPress={() => handleComprar(pacote)}
                  activeOpacity={0.85}
                >
                  {pacote.popular && (
                    <View style={s.popularBadge}>
                      <Text style={s.popularText}>Popular</Text>
                    </View>
                  )}
                  <Ionicons name="star" size={22} color={colors.credits} />
                  <Text style={s.pacoteCreditos}>{pacote.creditos}</Text>
                  <Text style={s.pacoteLabel}>créditos</Text>
                  <Text style={s.pacotePreco}>{pacote.preco}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Planos */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Planos de assinatura</Text>
            <Text style={s.sectionSub}>Créditos automáticos todo período</Text>

            {PLANOS.map(plano => (
              <View key={plano.id} style={[s.planoCard, plano.destaque && { borderColor: plano.cor, borderWidth: 2 }]}>
                {plano.destaque && (
                  <View style={[s.planoBadge, { backgroundColor: plano.cor }]}>
                    <Text style={s.planoBadgeText}>⭐ Mais popular</Text>
                  </View>
                )}
                <View style={s.planoTop}>
                  <View style={[s.planoIconWrap, { backgroundColor: plano.cor + '15' }]}>
                    <Ionicons name="shield-checkmark-outline" size={22} color={plano.cor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.planoNome, { color: plano.cor }]}>{plano.nome}</Text>
                    <Text style={s.planoRec}>{plano.rec}</Text>
                  </View>
                  <Text style={s.planoPreco}>{plano.preco}<Text style={s.planoPer}>/mês</Text></Text>
                </View>
                <View style={s.sep} />
                {plano.beneficios.map((b, i) => (
                  <View key={i} style={s.benefRow}>
                    <Ionicons name="checkmark-circle" size={15} color={plano.cor} />
                    <Text style={s.benefText}>{b}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[s.planoBtn, { backgroundColor: plano.cor }]}
                  onPress={() => navigation.navigate('Planos', { plano })}
                >
                  <Text style={s.planoBtnText}>Assinar {plano.nome}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: c.background },
  header:          { paddingHorizontal: Sp.lg, paddingBottom: Sp.xl },
  headerTitle:     { fontSize: Fs.xxl, fontWeight: '800', color: c.white, marginBottom: Sp.md },
  saldoBox:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Sp.sm },
  saldoLabel:      { fontSize: Fs.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  saldoValue:      { fontSize: 52, fontWeight: '800', color: c.white, lineHeight: 56 },
  saldoUnit:       { fontSize: Fs.sm, color: 'rgba(255,255,255,0.7)' },
  extratoBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Br.full },
  extratoBtnText:  { fontSize: Fs.sm, color: c.white, fontWeight: '600' },
  assinaturaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  assinaturaText:  { fontSize: Fs.sm, color: c.success, fontWeight: '500' },
  body:            { paddingHorizontal: Sp.lg, paddingTop: Sp.lg },
  section:         { marginBottom: Sp.xl },
  sectionTitle:    { fontSize: Fs.lg, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  sectionSub:      { fontSize: Fs.sm, color: c.textMuted, marginBottom: Sp.md },
  pacotesGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pacoteCard:      { width: '47%', backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, alignItems: 'center', gap: 4, ...Sh.sm, borderWidth: 1, borderColor: c.border },
  pacoteCardPopular: { borderColor: c.credits, borderWidth: 2 },
  popularBadge:    { backgroundColor: c.credits, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Br.full, marginBottom: 2 },
  popularText:     { fontSize: 10, color: c.white, fontWeight: '700' },
  pacoteCreditos:  { fontSize: 32, fontWeight: '800', color: c.textPrimary },
  pacoteLabel:     { fontSize: Fs.xs, color: c.textMuted },
  pacotePreco:     { fontSize: Fs.sm, fontWeight: '700', color: c.primary, marginTop: 4 },
  planoCard:       { backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, marginBottom: Sp.md, borderWidth: 1, borderColor: c.border, ...Sh.sm },
  planoBadge:      { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Br.full, marginBottom: Sp.sm },
  planoBadgeText:  { fontSize: Fs.xs, fontWeight: '700', color: c.white },
  planoTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Sp.sm },
  planoIconWrap:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  planoNome:       { fontSize: Fs.lg, fontWeight: '700' },
  planoRec:        { fontSize: Fs.xs, color: c.textMuted, marginTop: 2 },
  planoPreco:      { fontSize: Fs.lg, fontWeight: '800', color: c.textPrimary },
  planoPer:        { fontSize: Fs.xs, color: c.textMuted, fontWeight: '400' },
  sep:             { height: 1, backgroundColor: c.border, marginVertical: Sp.sm },
  benefRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  benefText:       { fontSize: Fs.sm, color: c.textSecondary },
  planoBtn:        { borderRadius: Br.md, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: Sp.md },
  planoBtnText:    { color: c.white, fontSize: Fs.md, fontWeight: '700' },
});
