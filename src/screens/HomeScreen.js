import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { creditosService, sessoesService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user }   = useAuth();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
    { icon: 'people',        label: 'Psicólogos', dest: 'Psicólogos',  color: Colors.info },
    { icon: 'calendar',      label: 'Sessões',    dest: 'Sessões',     color: Colors.success },
    { icon: 'wallet',        label: 'Créditos',   dest: 'Créditos',    color: Colors.credits },
    { icon: 'alert-circle',  label: 'Emergência', dest: 'Emergencia',  color: Colors.emergency },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Greeting */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{saudacao()},</Text>
            <Text style={styles.userName}>{user?.nome?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Credits card */}
        <TouchableOpacity
          style={styles.creditCard}
          onPress={() => navigation.navigate('Créditos')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.creditLabel}>Seus créditos</Text>
            <Text style={styles.creditValue}>
              {saldo === null ? '—' : `${saldo} créditos`}
            </Text>
            <Text style={styles.creditSub}>Toque para recarregar</Text>
          </View>
          <View style={styles.creditIcon}>
            <Ionicons name="wallet" size={30} color={Colors.credits} />
          </View>
        </TouchableOpacity>

        {/* Next session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próxima sessão</Text>
          {proximaSessao ? (
            <TouchableOpacity style={styles.sessaoCard} onPress={() => navigation.navigate('Sessões')}>
              <View style={styles.sessaoIcon}>
                <Ionicons name="calendar" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessaoNome}>{proximaSessao.psicologoNome ?? 'Psicólogo'}</Text>
                <Text style={styles.sessaoData}>{formatDate(proximaSessao.dataSessao)}</Text>
                <Text style={styles.sessaoDur}>{proximaSessao.duracao ?? 60} min</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.agendarBanner} onPress={() => navigation.navigate('Psicólogos')}>
              <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
              <Text style={styles.agendarText}>Agendar sua primeira sessão</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso rápido</Text>
          <View style={styles.quickGrid}>
            {QUICK.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickItem}
                onPress={() => navigation.navigate(item.dest)}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingHorizontal: Spacing.lg },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting:      { fontSize: FontSize.sm, color: Colors.textMuted },
  userName:      { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  notifBtn:      { padding: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.white, ...Shadow.sm },
  creditCard:    { backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.md },
  creditLabel:   { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  creditValue:   { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white },
  creditSub:     { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  creditIcon:    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  section:       { marginBottom: Spacing.lg },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  sessaoCard:    { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', ...Shadow.sm },
  sessaoIcon:    { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  sessaoNome:    { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  sessaoData:    { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  sessaoDur:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  agendarBanner: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.primary + '30' },
  agendarText:   { flex: 1, fontSize: FontSize.md, fontWeight: '500', color: Colors.primary },
  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem:     { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  quickIcon:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel:    { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },
});
