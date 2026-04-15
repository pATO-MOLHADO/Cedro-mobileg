import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { sessoesService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';

const FILTROS = ['todas', 'agendada', 'realizada', 'cancelada'];

function CardSessao({ item, onCancelar, colors, Spacing, FontSize, BorderRadius, Shadow }) {
  const STATUS = {
    agendada:  { label: 'Agendada',  color: colors.agendada,  icon: 'time-outline',             bg: colors.agendada + '15' },
    realizada: { label: 'Realizada', color: colors.realizada, icon: 'checkmark-circle-outline', bg: colors.realizada + '15' },
    cancelada: { label: 'Cancelada', color: colors.cancelada, icon: 'close-circle-outline',     bg: colors.cancelada + '15' },
  };
  const st = STATUS[item.statusSessao] ?? STATUS.agendada;
  const d = new Date(item.dataSessao);
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, marginBottom: 10, overflow: 'hidden' }, Shadow.sm]}>
      <View style={{ height: 3, backgroundColor: st.color }} />
      <View style={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            {item.psicologoNome && (
              <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 }}>{item.psicologoNome}</Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{data}</Text>
              <Text style={{ color: colors.textMuted }}>·</Text>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{hora}</Text>
            </View>
            <Text style={{ fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 }}>{item.duracao ?? 60} minutos</Text>
          </View>
          <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full }, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={12} color={st.color} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: st.color }}>{st.label}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: Spacing.sm }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.primary }}>
            R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}
          </Text>
          {item.statusSessao === 'agendada' && (
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.error + '60', backgroundColor: colors.error + '08' }}
              onPress={() => onCancelar(item)}
            >
              <Text style={{ fontSize: FontSize.sm, color: colors.error, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function SessoesScreen({ navigation }) {
  const { user }   = useAuth();
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
  const insets     = useSafeAreaInsets();
  const [sessoes, setSessoes]       = useState([]);
  const [filtro, setFiltro]         = useState('todas');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await sessoesService.minhasSessoes(user?.id);
      const lista = Array.isArray(data) ? data : [];
      setSessoes(lista.sort((a, b) => new Date(b.dataSessao) - new Date(a.dataSessao)));
    } catch (_) {}
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtradas = sessoes.filter(s => filtro === 'todas' || s.statusSessao === filtro);

  const COUNTS = {
    todas:     sessoes.length,
    agendada:  sessoes.filter(s => s.statusSessao === 'agendada').length,
    realizada: sessoes.filter(s => s.statusSessao === 'realizada').length,
    cancelada: sessoes.filter(s => s.statusSessao === 'cancelada').length,
  };

  const handleCancelar = (sessao) => {
    Alert.alert('Cancelar sessão', 'Tem certeza que deseja cancelar esta sessão?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar sessão',
        style: 'destructive',
        onPress: async () => {
          try {
            await sessoesService.cancelar(sessao.id);
            await load();
          } catch (_) {
            Alert.alert('Erro', 'Não foi possível cancelar a sessão.');
          }
        },
      },
    ]);
  };

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Text style={s.title}>Minhas sessões</Text>
        <View style={s.filtros}>
          {FILTROS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filtroBtn, filtro === f && s.filtroBtnActive]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[s.filtroText, filtro === f && s.filtroTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
              {COUNTS[f] > 0 && (
                <View style={[s.filtroCount, filtro === f && s.filtroCountActive]}>
                  <Text style={[s.filtroCountText, filtro === f && { color: colors.white }]}>{COUNTS[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <CardSessao
              item={item}
              onCancelar={handleCancelar}
              colors={colors}
              Spacing={Spacing}
              FontSize={FontSize}
              BorderRadius={BorderRadius}
              Shadow={Shadow}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>Nenhuma sessão</Text>
              <Text style={s.emptyText}>Agende sua primeira sessão com um psicólogo</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Psicólogos')}>
                <Text style={s.emptyBtnText}>Encontrar psicólogo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: c.background },
  header:           { backgroundColor: c.card, paddingHorizontal: Sp.lg, paddingBottom: Sp.md, borderBottomWidth: 1, borderBottomColor: c.border },
  title:            { fontSize: Fs.xxl, fontWeight: '800', color: c.textPrimary, marginBottom: Sp.md },
  filtros:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filtroBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Br.full, borderWidth: 1, borderColor: c.border, backgroundColor: c.background },
  filtroBtnActive:  { backgroundColor: c.primary, borderColor: c.primary },
  filtroText:       { fontSize: Fs.sm, color: c.textMuted, fontWeight: '500' },
  filtroTextActive: { color: c.white, fontWeight: '600' },
  filtroCount:      { backgroundColor: c.border, borderRadius: Br.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filtroCountActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },
  filtroCountText:  { fontSize: 10, color: c.textMuted, fontWeight: '700' },
  list:             { padding: Sp.lg, paddingBottom: 100 },
  empty:            { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon:        { width: 80, height: 80, borderRadius: 40, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:       { fontSize: Fs.lg, fontWeight: '700', color: c.textPrimary },
  emptyText:        { fontSize: Fs.sm, color: c.textMuted, textAlign: 'center' },
  emptyBtn:         { backgroundColor: c.primary, paddingHorizontal: Sp.lg, paddingVertical: 12, borderRadius: Br.md, marginTop: 4 },
  emptyBtnText:     { color: c.white, fontWeight: '700', fontSize: Fs.sm },
});
