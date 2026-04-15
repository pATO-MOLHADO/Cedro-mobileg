import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const TAXA = 0.10;

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#06b6d4'];

function StarRow({ nota, colors, FontSize }) {
  const n = Math.round(nota ?? 5);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={16} color="#F59E0B" />
      ))}
      <Text style={{ fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>({nota ?? 5}.0)</Text>
    </View>
  );
}

export default function PsicologoDetailScreen({ navigation, route }) {
  const { psicologo } = route.params ?? {};
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
  const insets = useSafeAreaInsets();

  const precoBase  = parseFloat(psicologo?.precoSessao ?? 0);
  const precoFinal = precoBase > 0
    ? `R$ ${(precoBase * (1 + TAXA)).toFixed(2).replace('.', ',')}`
    : '—';

  const avatarColor = AVATAR_COLORS[(psicologo?.id ?? 0) % AVATAR_COLORS.length];

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={[s.headerBg, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>

          <View style={s.avatarBox}>
            <View style={[s.avatarRing, { borderColor: avatarColor + '60' }]}>
              <View style={[s.avatar, { backgroundColor: avatarColor + '25' }]}>
                <Text style={[s.avatarLetter, { color: avatarColor }]}>{psicologo?.nome?.charAt(0)?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.nome}>{psicologo?.nome}</Text>
            <View style={s.espBadge}>
              <Text style={s.esp}>{psicologo?.especialidade ?? 'Psicologia geral'}</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <StarRow nota={psicologo?.avaliacao} colors={colors} FontSize={FontSize} />
            </View>
          </View>
        </LinearGradient>

        {/* Sobre */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={s.cardTitle}>Sobre</Text>
          </View>
          <Text style={s.bio}>
            {psicologo?.bio ?? 'Profissional dedicado ao bem-estar dos pacientes, com abordagem humanista e acolhedora.'}
          </Text>
        </View>

        {/* Preço */}
        <View style={s.card}>
          <View style={s.precoRow}>
            <View>
              <Text style={s.precoLabel}>Valor por sessão</Text>
              <Text style={s.precoSub}>Inclui taxa de serviço Cedro (10%)</Text>
            </View>
            <Text style={s.preco}>{precoFinal}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={s.cardTitle}>Informações</Text>
          </View>
          {[
            { icon: 'time-outline',     label: 'Duração padrão', value: '60 minutos' },
            { icon: 'globe-outline',    label: 'Modalidade',     value: 'Online (videochamada)' },
            { icon: 'language-outline', label: 'Idiomas',        value: 'Português' },
          ].map(item => (
            <View key={item.label} style={s.infoRow}>
              <View style={s.infoIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[s.actions, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={s.agendarBtn}
          onPress={() => navigation.navigate('AgendarSessao', { psicologo })}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={s.agendarBtnText}>Agendar sessão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.chatBtn}
          onPress={() => navigation.navigate('ChatPsicologo', { psicologo })}
        >
          <Ionicons name="chatbubbles" size={20} color={colors.white} />
          <Text style={s.chatBtnText}>Iniciar chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: c.background },
  headerBg:     { paddingHorizontal: Sp.lg, paddingBottom: Sp.xl },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Sp.md },
  avatarBox:    { alignItems: 'center' },
  avatarRing:   { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: Sp.sm },
  avatar:       { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 42, fontWeight: '800' },
  nome:         { fontSize: Fs.xl, fontWeight: '800', color: c.white, textAlign: 'center' },
  espBadge:     { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Br.full, marginTop: 6 },
  esp:          { fontSize: Fs.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  card:         { backgroundColor: c.card, marginHorizontal: Sp.lg, marginTop: Sp.md, borderRadius: Br.lg, padding: Sp.md, ...Sh.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Sp.sm },
  cardTitle:    { fontSize: Fs.md, fontWeight: '700', color: c.textPrimary },
  bio:          { fontSize: Fs.md, color: c.textSecondary, lineHeight: 24 },
  precoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  precoLabel:   { fontSize: Fs.md, fontWeight: '600', color: c.textPrimary },
  precoSub:     { fontSize: Fs.xs, color: c.textMuted, marginTop: 2 },
  preco:        { fontSize: Fs.xl, fontWeight: '800', color: c.primary },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoIcon:     { width: 38, height: 38, borderRadius: 19, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  infoLabel:    { fontSize: Fs.xs, color: c.textMuted },
  infoValue:    { fontSize: Fs.sm, color: c.textPrimary, fontWeight: '600' },
  actions:      { backgroundColor: c.card, paddingHorizontal: Sp.lg, paddingTop: Sp.md, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', gap: 10 },
  agendarBtn:   { flex: 1, height: 52, borderRadius: Br.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: c.primary },
  agendarBtnText: { color: c.primary, fontSize: Fs.md, fontWeight: '700' },
  chatBtn:      { flex: 1, height: 52, backgroundColor: c.primary, borderRadius: Br.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatBtnText:  { color: c.white, fontSize: Fs.md, fontWeight: '700' },
});
