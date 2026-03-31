import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

const TAXA = 0.10;

function StarRow({ nota }) {
  const n = Math.round(nota ?? 5);
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={16} color="#F39C12" />
      ))}
      <Text style={{ fontSize: FontSize.sm, color: Colors.textMuted, marginLeft: 4 }}>({nota ?? 5}.0)</Text>
    </View>
  );
}

export default function PsicologoDetailScreen({ navigation, route }) {
  const { psicologo } = route.params ?? {};
  const insets = useSafeAreaInsets();

  const precoBase  = parseFloat(psicologo?.precoSessao ?? 0);
  const precoFinal = precoBase > 0
    ? `R$ ${(precoBase * (1 + TAXA)).toFixed(2).replace('.', ',')}`
    : '—';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header verde */}
        <View style={[styles.headerBg, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{psicologo?.nome?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <Text style={styles.nome}>{psicologo?.nome}</Text>
            <Text style={styles.esp}>{psicologo?.especialidade ?? 'Psicologia geral'}</Text>
            <View style={{ marginTop: 8 }}>
              <StarRow nota={psicologo?.avaliacao} />
            </View>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre</Text>
          <Text style={styles.bio}>
            {psicologo?.bio ?? 'Profissional dedicado ao bem-estar dos pacientes, com abordagem humanista e acolhedora.'}
          </Text>
        </View>

        {/* Preço */}
        <View style={styles.card}>
          <View style={styles.precoRow}>
            <Text style={styles.precoLabel}>Valor por sessão</Text>
            <Text style={styles.preco}>{precoFinal}</Text>
          </View>
          <Text style={styles.precoSub}>Inclui taxa de serviço Cedro (10%)</Text>
        </View>

        {/* Info extras */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações</Text>
          {[
            { icon: 'time-outline',     label: 'Duração padrão', value: '60 minutos' },
            { icon: 'globe-outline',    label: 'Modalidade',     value: 'Online (videochamada)' },
            { icon: 'language-outline', label: 'Idiomas',        value: 'Português' },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botões de ação fixos */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.agendarBtn}
          onPress={() => navigation.navigate('AgendarSessao', { psicologo })}
        >
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={styles.agendarBtnText}>Agendar sessão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate('ChatPsicologo', { psicologo })}
        >
          <Ionicons name="chatbubbles" size={20} color={Colors.white} />
          <Text style={styles.chatBtnText}>Chat · usa créditos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  headerBg:    { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn:     { marginBottom: Spacing.md },
  avatarBox:   { alignItems: 'center' },
  avatar:      { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarLetter:{ fontSize: 40, fontWeight: '700', color: Colors.primary },
  nome:        { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  esp:         { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card:        { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
  cardTitle:   { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  bio:         { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  precoRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  precoLabel:  { fontSize: FontSize.md, color: Colors.textSecondary },
  preco:       { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  precoSub:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  infoLabel:   { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue:   { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  actions:     { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  agendarBtn:  { height: 50, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary },
  agendarBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  chatBtn:     { height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
});
