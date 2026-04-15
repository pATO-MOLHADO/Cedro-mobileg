import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { creditosService, sessoesService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';

export default function HomeScreen({ navigation }) {
  const { user }   = useAuth();
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
  const insets     = useSafeAreaInsets();
  const [saldo, setSaldo]               = useState(null);
  const [proximaSessao, setProximaSessao] = useState(null);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.allSettled([
        creditosService.saldo(user?.id),
        sessoesService.minhasSessoes(user?.id),
      ]);
      if (cRes.status === 'fulfilled') setSaldo(cRes.value.data?.saldo ?? 0);
      if (sRes.status === 'fulfilled') {
        const agendadas = (sRes.value.data ?? [])
          .filter(s => s.statusSessao === 'agendada')
          .sort((a, b) => new Date(a.dataSessao) - new Date(b.dataSessao));
        setProximaSessao(agendadas[0] ?? null);
      }
    } catch (_) {}
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const QUICK = [
    { icon: 'people',       label: 'Psicólogos', dest: 'Psicólogos', color: colors.info,      bg: colors.info + '15' },
    { icon: 'calendar',     label: 'Sessões',    dest: 'Sessões',    color: colors.success,   bg: colors.success + '15' },
    { icon: 'wallet',       label: 'Créditos',   dest: 'Créditos',   color: colors.credits,   bg: colors.credits + '15' },
    { icon: 'alert-circle', label: 'Emergência', dest: 'Emergencia', color: colors.emergency, bg: colors.emergency + '15' },
  ];

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header com gradiente */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={[s.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={s.headerRow}>
            <View>
              <Text style={s.greeting}>{saudacao()},</Text>
              <Text style={s.userName}>{user?.nome?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity style={s.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Card de créditos dentro do header */}
          <TouchableOpacity style={s.creditCard} onPress={() => navigation.navigate('Créditos')} activeOpacity={0.85}>
            <View style={s.creditLeft}>
              <View style={s.creditIconWrap}>
                <Ionicons name="wallet" size={22} color={colors.credits} />
              </View>
              <View>
                <Text style={s.creditLabel}>Seus créditos</Text>
                <Text style={s.creditValue}>{saldo === null ? '—' : `${saldo} créditos`}</Text>
              </View>
            </View>
            <View style={s.creditArrow}>
              <Text style={s.creditArrowText}>Recarregar</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={s.body}>
          {/* Próxima sessão */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Próxima sessão</Text>
            {proximaSessao ? (
              <TouchableOpacity style={s.sessaoCard} onPress={() => navigation.navigate('Sessões')} activeOpacity={0.85}>
                <View style={s.sessaoIconWrap}>
                  <Ionicons name="calendar" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sessaoNome}>{proximaSessao.psicologoNome ?? 'Psicólogo'}</Text>
                  <Text style={s.sessaoData}>{formatDate(proximaSessao.dataSessao)}</Text>
                  <View style={s.sessaoBadge}>
                    <View style={[s.dot, { backgroundColor: colors.agendada }]} />
                    <Text style={s.sessaoBadgeText}>{proximaSessao.duracao ?? 60} min · Agendada</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.agendarBanner} onPress={() => navigation.navigate('Psicólogos')} activeOpacity={0.85}>
                <View style={s.agendarIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.agendarTitle}>Nenhuma sessão agendada</Text>
                  <Text style={s.agendarSub}>Encontre um psicólogo e agende agora</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Acesso rápido */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Acesso rápido</Text>
            <View style={s.quickGrid}>
              {QUICK.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={s.quickItem}
                  onPress={() => navigation.navigate(item.dest)}
                  activeOpacity={0.8}
                >
                  <View style={[s.quickIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={26} color={item.color} />
                  </View>
                  <Text style={s.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dica de bem-estar */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Dica do dia</Text>
            <View style={s.dicaCard}>
              <Ionicons name="bulb-outline" size={22} color={colors.warning} style={{ marginBottom: 8 }} />
              <Text style={s.dicaText}>
                Reservar 10 minutos por dia para respiração consciente pode reduzir significativamente os níveis de ansiedade.
              </Text>
            </View>
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
  headerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Sp.lg },
  greeting:        { fontSize: Fs.sm, color: 'rgba(255,255,255,0.75)' },
  userName:        { fontSize: Fs.xl, fontWeight: '800', color: c.white, marginTop: 2 },
  notifBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  creditCard:      { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Br.lg, padding: Sp.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  creditLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creditIconWrap:  { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  creditLabel:     { fontSize: Fs.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  creditValue:     { fontSize: Fs.lg, fontWeight: '700', color: c.white },
  creditArrow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creditArrowText: { fontSize: Fs.xs, color: 'rgba(255,255,255,0.7)' },
  body:            { paddingHorizontal: Sp.lg, paddingTop: Sp.lg },
  section:         { marginBottom: Sp.lg },
  sectionTitle:    { fontSize: Fs.md, fontWeight: '700', color: c.textPrimary, marginBottom: Sp.sm },
  sessaoCard:      { backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, flexDirection: 'row', alignItems: 'center', gap: 12, ...Sh.sm },
  sessaoIconWrap:  { width: 48, height: 48, borderRadius: 24, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  sessaoNome:      { fontSize: Fs.md, fontWeight: '600', color: c.textPrimary, marginBottom: 2 },
  sessaoData:      { fontSize: Fs.sm, color: c.textSecondary, marginBottom: 4 },
  sessaoBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:             { width: 6, height: 6, borderRadius: 3 },
  sessaoBadgeText: { fontSize: Fs.xs, color: c.textMuted },
  agendarBanner:   { backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: c.primary + '40', ...Sh.sm },
  agendarIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  agendarTitle:    { fontSize: Fs.md, fontWeight: '600', color: c.textPrimary },
  agendarSub:      { fontSize: Fs.sm, color: c.textMuted, marginTop: 2 },
  quickGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem:       { width: '47%', backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, alignItems: 'center', gap: 8, ...Sh.sm },
  quickIcon:       { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  quickLabel:      { fontSize: Fs.sm, fontWeight: '600', color: c.textPrimary },
  dicaCard:        { backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, borderLeftWidth: 3, borderLeftColor: c.warning, ...Sh.sm },
  dicaText:        { fontSize: Fs.sm, color: c.textSecondary, lineHeight: 22 },
});
