import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { creditosService } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

export default function PlanosScreen({ navigation, route }) {
  const { plano } = route.params ?? {};
  const insets    = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleAssinar = async () => {
    setLoading(true);
    try {
      await creditosService.assinar({ planoId: plano?.id, nome: plano?.nome });
      Alert.alert(
        '🎉 Assinatura ativada!',
        `Plano ${plano?.nome} ativo.\n${plano?.recorrencia} adicionados automaticamente.`,
        [{ text: 'Ok', onPress: () => navigation.navigate('Créditos') }]
      );
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível ativar o plano. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar assinatura</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ícone + nome do plano */}
        <View style={styles.planoHero}>
          <View style={styles.planoIconBox}>
            <Ionicons name="wallet" size={40} color={Colors.credits} />
          </View>
          <Text style={styles.planoNome}>Plano {plano?.nome}</Text>
          <Text style={styles.planoPeriodo}>{plano?.periodo}</Text>
          <Text style={styles.planoPreco}>{plano?.preco}<Text style={styles.planoPer}>/mês</Text></Text>
          <Text style={styles.planoRec}>{plano?.recorrencia}</Text>
        </View>

        {/* Benefícios */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>O que você recebe</Text>
          {(plano?.beneficios ?? []).map((b, i) => (
            <View key={i} style={styles.benefRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              <Text style={styles.benefText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Aviso pagamento */}
        <View style={styles.avisoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
          <Text style={styles.avisoText}>
            Integração com pagamento em desenvolvimento. Em modo demo, a assinatura é ativada sem cobrança.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleAssinar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Assinar {plano?.nome} · {plano?.preco}/mês</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: 14 },
  headerTitle:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  scroll:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  planoHero:    { alignItems: 'center', marginBottom: Spacing.xl },
  planoIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.creditsLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  planoNome:    { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  planoPeriodo: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  planoPreco:   { fontSize: 40, fontWeight: '700', color: Colors.primary },
  planoPer:     { fontSize: FontSize.lg, fontWeight: '400', color: Colors.textMuted },
  planoRec:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  cardTitle:    { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  benefRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefText:    { fontSize: FontSize.md, color: Colors.textSecondary, flex: 1 },
  avisoCard:    { backgroundColor: Colors.info + '12', borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avisoText:    { fontSize: FontSize.sm, color: Colors.info, flex: 1, lineHeight: 20 },
  footer:       { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  btn:          { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  cancelBtn:    { alignItems: 'center', paddingVertical: 8 },
  cancelText:   { fontSize: FontSize.sm, color: Colors.textMuted },
});
