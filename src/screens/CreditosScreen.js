import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { creditosService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

const PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    periodo: 'Mensal',
    preco: 'R$ 49,90',
    recorrencia: '10 créditos/semana',
    beneficios: ['10 créditos toda semana', 'Chat com psicólogos', 'Suporte por email'],
    destaque: false,
    cor: Colors.info,
  },
  {
    id: 'premium',
    nome: 'Premium',
    periodo: 'Mensal',
    preco: 'R$ 89,90',
    recorrencia: '20 créditos/dia',
    beneficios: ['20 créditos todo dia', 'Chat ilimitado', 'Agendamento prioritário', 'Desconto em sessões', 'Suporte 24h'],
    destaque: true,
    cor: Colors.primary,
  },
  {
    id: 'anual',
    nome: 'Anual',
    periodo: 'Anual',
    preco: 'R$ 599,90',
    recorrencia: '15 créditos/semana',
    beneficios: ['15 créditos toda semana', 'Todos os benefícios Premium', '2 meses grátis'],
    destaque: false,
    cor: Colors.credits,
  },
];

const PACOTES = [
  { id: 'p5',  creditos: 5,  preco: 'R$ 14,90' },
  { id: 'p10', creditos: 10, preco: 'R$ 24,90' },
  { id: 'p20', creditos: 20, preco: 'R$ 44,90' },
  { id: 'p50', creditos: 50, preco: 'R$ 99,90' },
];

export default function CreditosScreen({ navigation }) {
  const { user }   = useAuth();
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
              Alert.alert('✅ Compra realizada!', `+${pacote.creditos} créditos adicionados ao seu saldo.`);
            } catch (_) {
              Alert.alert('Erro', 'Não foi possível completar a compra.');
            }
          },
        },
      ]
    );
  };

  const handleAssinar = (plano) => {
    navigation.navigate('Planos', { plano });
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Saldo */}
        <View style={styles.saldoCard}>
          <View>
            <Text style={styles.saldoLabel}>Seu saldo</Text>
            <Text style={styles.saldoValue}>{saldo ?? 0} créditos</Text>
            {assinatura
              ? <Text style={styles.saldoSub}>Plano {assinatura.nomePlano} ativo ✓</Text>
              : <Text style={styles.saldoSub}>Sem assinatura ativa</Text>
            }
          </View>
          <TouchableOpacity style={styles.extratoBtn} onPress={() => navigation.navigate('Extrato')}>
            <Ionicons name="receipt-outline" size={20} color={Colors.white} />
            <Text style={styles.extratoBtnText}>Extrato</Text>
          </TouchableOpacity>
        </View>

        {/* Planos */}
        <Text style={styles.sectionTitle}>Planos de assinatura</Text>
        <Text style={styles.sectionSub}>Créditos automáticos todo período</Text>

        {PLANOS.map(plano => (
          <View key={plano.id} style={[styles.planoCard, plano.destaque && styles.planoDestaque]}>
            {plano.destaque && (
              <View style={styles.planoBadge}>
                <Text style={styles.planoBadgeText}>Mais popular</Text>
              </View>
            )}
            <View style={styles.planoHeader}>
              <View>
                <Text style={[styles.planoNome, { color: plano.cor }]}>{plano.nome}</Text>
                <Text style={styles.planoPeriodo}>{plano.periodo}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planoPreco}>{plano.preco}</Text>
                <Text style={styles.planoRec}>{plano.recorrencia}</Text>
              </View>
            </View>
            <View style={styles.sep} />
            {plano.beneficios.map((b, i) => (
              <View key={i} style={styles.benefRow}>
                <Ionicons name="checkmark-circle" size={16} color={plano.cor} />
                <Text style={styles.benefText}>{b}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.planoBtn, { backgroundColor: plano.cor }]} onPress={() => handleAssinar(plano)}>
              <Text style={styles.planoBtnText}>Assinar {plano.nome}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Avulso */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Compra avulsa</Text>
        <Text style={styles.sectionSub}>Sem mensalidade, pague só o que precisar</Text>

        <View style={styles.avulsosGrid}>
          {PACOTES.map(pacote => (
            <TouchableOpacity key={pacote.id} style={styles.avulsoCard} onPress={() => handleComprar(pacote)}>
              <Ionicons name="star" size={20} color={Colors.credits} />
              <Text style={styles.avulsoCreditos}>{pacote.creditos}</Text>
              <Text style={styles.avulsoLabel}>créditos</Text>
              <Text style={styles.avulsoPreco}>{pacote.preco}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scroll:         { paddingHorizontal: Spacing.lg },
  saldoCard:      { backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, ...Shadow.md },
  saldoLabel:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  saldoValue:     { fontSize: 32, fontWeight: '700', color: Colors.white },
  saldoSub:       { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  extratoBtn:     { alignItems: 'center', gap: 4 },
  extratoBtnText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  sectionTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSub:     { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  planoCard:      { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  planoDestaque:  { borderColor: Colors.primary, borderWidth: 2 },
  planoBadge:     { alignSelf: 'flex-start', backgroundColor: Colors.primarySurface, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, marginBottom: 10 },
  planoBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  planoHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  planoNome:      { fontSize: FontSize.lg, fontWeight: '700' },
  planoPeriodo:   { fontSize: FontSize.sm, color: Colors.textMuted },
  planoPreco:     { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  planoRec:       { fontSize: FontSize.xs, color: Colors.textMuted },
  sep:            { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  benefRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  benefText:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  planoBtn:       { borderRadius: BorderRadius.md, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  planoBtnText:   { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  avulsosGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avulsoCard:     { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  avulsoCreditos: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  avulsoLabel:    { fontSize: FontSize.xs, color: Colors.textMuted },
  avulsoPreco:    { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary, marginTop: 4 },
});
