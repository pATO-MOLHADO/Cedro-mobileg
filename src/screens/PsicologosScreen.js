import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { psicologosService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

const TAXA = 0.10;

function StarRow({ nota }) {
  const n = Math.round(nota ?? 5);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={12} color="#F39C12" />
      ))}
    </View>
  );
}

function CardPsicologo({ item, onPress }) {
  const precoFinal = item.precoSessao
    ? `R$ ${(parseFloat(item.precoSessao) * (1 + TAXA)).toFixed(2).replace('.', ',')}`
    : '—';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardAvatar}>
        <Text style={styles.avatarLetter}>{item.nome.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.cardEsp} numberOfLines={1}>{item.especialidade ?? 'Psicologia geral'}</Text>
        <StarRow nota={item.avaliacao} />
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardPreco}>{precoFinal}</Text>
        <Text style={styles.cardPrecoPor}>por sessão</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function PsicologosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [psicologos, setPsicologos] = useState([]);
  const [filtrado, setFiltrado]     = useState([]);
  const [busca, setBusca]           = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    psicologosService.listar()
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : [];
        setPsicologos(lista);
        setFiltrado(lista);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = busca.toLowerCase().trim();
    setFiltrado(
      q
        ? psicologos.filter(p =>
            p.nome.toLowerCase().includes(q) ||
            (p.especialidade ?? '').toLowerCase().includes(q)
          )
        : psicologos
    );
  }, [busca, psicologos]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Psicólogos</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou especialidade"
            placeholderTextColor={Colors.textMuted}
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.taxaInfo}>Preços incluem taxa de serviço (+10%)</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtrado}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <CardPsicologo
              item={item}
              onPress={() => navigation.navigate('PerfilPsicologo', { psicologo: item })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum psicólogo encontrado</Text>
            </View>
          }
        />
      )}

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  searchBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 44, gap: 8 },
  searchInput:  { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  taxaInfo:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 8 },
  list:         { padding: Spacing.lg, gap: 12, paddingBottom: 100 },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, ...Shadow.sm },
  cardAvatar:   { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  cardNome:     { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  cardEsp:      { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  cardRight:    { alignItems: 'flex-end' },
  cardPreco:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cardPrecoPor: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty:        { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:    { fontSize: FontSize.md, color: Colors.textMuted },
});
