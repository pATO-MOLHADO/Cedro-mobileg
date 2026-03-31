import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { sessoesService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

const STATUS = {
  agendada:  { label: 'Agendada',  color: Colors.agendada,  icon: 'time-outline' },
  realizada: { label: 'Realizada', color: Colors.realizada, icon: 'checkmark-circle-outline' },
  cancelada: { label: 'Cancelada', color: Colors.cancelada, icon: 'close-circle-outline' },
};

const FILTROS = ['todas', 'agendada', 'realizada', 'cancelada'];

function CardSessao({ item, onCancelar }) {
  const st = STATUS[item.statusSessao] ?? STATUS.agendada;
  const d = new Date(item.dataSessao);
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={[styles.statusBar, { backgroundColor: st.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            {item.psicologoNome && (
              <Text style={styles.cardPsicologo}>{item.psicologoNome}</Text>
            )}
            <Text style={styles.cardData}>{data}</Text>
            <Text style={styles.cardHora}>{hora} · {item.duracao ?? 60} min</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: st.color + '18' }]}>
            <Ionicons name={st.icon} size={13} color={st.color} />
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={styles.sep} />
        <View style={styles.cardBottom}>
          <Text style={styles.cardValor}>
            R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}
          </Text>
          {item.statusSessao === 'agendada' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancelar(item)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function SessoesScreen({ navigation }) {
  const { user }   = useAuth();
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Minhas sessões</Text>
        <View style={styles.filtros}>
          {FILTROS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.filtroText, filtro === f && styles.filtroTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <CardSessao item={item} onCancelar={handleCancelar} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma sessão encontrada</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Psicólogos')}>
                <Text style={styles.emptyBtnText}>Agendar sessão</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  header:           { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:            { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  filtros:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filtroBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  filtroBtnActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText:       { fontSize: FontSize.sm, color: Colors.textMuted },
  filtroTextActive: { color: Colors.white, fontWeight: '600' },
  list:             { padding: Spacing.lg, gap: 12, paddingBottom: 100 },
  card:             { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...Shadow.sm },
  statusBar:        { width: 4 },
  cardBody:         { flex: 1, padding: Spacing.md },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardPsicologo:    { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  cardData:         { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardHora:         { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  badge:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeText:        { fontSize: FontSize.xs, fontWeight: '600' },
  sep:              { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  cardBottom:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValor:        { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cancelBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.error },
  cancelText:       { fontSize: FontSize.sm, color: Colors.error, fontWeight: '500' },
  empty:            { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:        { fontSize: FontSize.md, color: Colors.textMuted },
  emptyBtn:         { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: BorderRadius.md, marginTop: 4 },
  emptyBtnText:     { color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
});
