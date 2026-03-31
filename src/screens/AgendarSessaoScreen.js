import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { sessoesService } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

const TAXA = 0.10;

// Gera próximos 14 dias úteis
function proximosDias(qtd = 14) {
  const dias = [];
  const hoje = new Date();
  let d = new Date(hoje);
  d.setDate(d.getDate() + 1); // começa amanhã
  while (dias.length < qtd) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) { // seg-sex
      dias.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function AgendarSessaoScreen({ navigation, route }) {
  const { psicologo } = route.params ?? {};
  const { user }      = useAuth();
  const insets        = useSafeAreaInsets();

  const [diaSel, setDiaSel]     = useState(null);
  const [horaSel, setHoraSel]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const dias = proximosDias(14);

  const precoBase  = parseFloat(psicologo?.precoSessao ?? 0);
  const precoFinal = precoBase > 0 ? (precoBase * (1 + TAXA)).toFixed(2).replace('.', ',') : '—';

  const handleAgendar = async () => {
    if (!diaSel || !horaSel) {
      Alert.alert('Atenção', 'Selecione um dia e horário.');
      return;
    }

    const [h, m] = horaSel.split(':');
    const dataSessao = new Date(diaSel);
    dataSessao.setHours(parseInt(h), parseInt(m), 0, 0);

    setLoading(true);
    try {
      await sessoesService.agendar({
        pacienteId:    user?.id,
        psicologoId:   psicologo?.id,
        psicologoNome: psicologo?.nome,
        dataSessao:    dataSessao.toISOString(),
        duracao:       60,
        valor:         precoBase * (1 + TAXA),
      });

      Alert.alert(
        '✅ Sessão agendada!',
        `${psicologo?.nome}\n${dataSessao.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às ${horaSel}`,
        [{ text: 'Ver sessões', onPress: () => navigation.navigate('Sessões') }]
      );
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível agendar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar sessão</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Psicólogo */}
        <View style={styles.psicCard}>
          <View style={styles.psicAvatar}>
            <Text style={styles.psicAvatarLetter}>{psicologo?.nome?.charAt(0) ?? 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.psicNome}>{psicologo?.nome ?? 'Psicólogo'}</Text>
            <Text style={styles.psicEsp}>{psicologo?.especialidade ?? 'Psicologia geral'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.psicPreco}>R$ {precoFinal}</Text>
            <Text style={styles.psicPrecoPor}>60 min</Text>
          </View>
        </View>

        {/* Escolha o dia */}
        <Text style={styles.sectionTitle}>Escolha o dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasRow}>
          {dias.map((dia, idx) => {
            const sel = diaSel?.toDateString() === dia.toDateString();
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.diaItem, sel && styles.diaItemSel]}
                onPress={() => setDiaSel(dia)}
              >
                <Text style={[styles.diaDow, sel && styles.diaTextSel]}>{DIAS_PT[dia.getDay()]}</Text>
                <Text style={[styles.diaNum, sel && styles.diaTextSel]}>{dia.getDate()}</Text>
                <Text style={[styles.diaMes, sel && styles.diaTextSel]}>{MESES_PT[dia.getMonth()]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Escolha o horário */}
        <Text style={styles.sectionTitle}>Escolha o horário</Text>
        <View style={styles.horariosGrid}>
          {HORARIOS.map(h => {
            const sel = horaSel === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.horarioItem, sel && styles.horarioItemSel]}
                onPress={() => setHoraSel(h)}
              >
                <Text style={[styles.horarioText, sel && styles.horarioTextSel]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Resumo */}
        {diaSel && horaSel && (
          <View style={styles.resumo}>
            <Text style={styles.resumoTitle}>Resumo do agendamento</Text>
            <View style={styles.resumoRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.resumoText}>{psicologo?.nome}</Text>
            </View>
            <View style={styles.resumoRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.resumoText}>
                {diaSel.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {horaSel}
              </Text>
            </View>
            <View style={styles.resumoRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.resumoText}>60 minutos</Text>
            </View>
            <View style={styles.resumoRow}>
              <Ionicons name="wallet-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.resumoText}>R$ {precoFinal}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botão confirmar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.btn, (!diaSel || !horaSel || loading) && styles.btnDisabled]}
          onPress={handleAgendar}
          disabled={!diaSel || !horaSel || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.btnText}>Confirmar agendamento</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  header:           { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: 14 },
  headerTitle:      { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  scroll:           { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  psicCard:         { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg, ...Shadow.sm },
  psicAvatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  psicAvatarLetter: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  psicNome:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  psicEsp:          { fontSize: FontSize.sm, color: Colors.textMuted },
  psicPreco:        { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  psicPrecoPor:     { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionTitle:     { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  diasRow:          { gap: 10, paddingBottom: Spacing.md },
  diaItem:          { width: 64, alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  diaItemSel:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  diaDow:           { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  diaNum:           { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginVertical: 2 },
  diaMes:           { fontSize: FontSize.xs, color: Colors.textMuted },
  diaTextSel:       { color: Colors.white },
  horariosGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  horarioItem:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  horarioItemSel:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  horarioText:      { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  horarioTextSel:   { color: Colors.white },
  resumo:           { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: 10, borderWidth: 1, borderColor: Colors.primary + '30' },
  resumoTitle:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  resumoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resumoText:       { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  footer:           { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  btn:              { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDisabled:      { opacity: 0.5 },
  btnText:          { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
