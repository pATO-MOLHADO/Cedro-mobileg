import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { psicologosService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';

const TAXA = 0.10;

function StarRow({ nota, colors, FontSize }) {
  const n = Math.round(nota ?? 5);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={11} color="#F59E0B" />
      ))}
      <Text style={{ fontSize: FontSize.xs, color: colors.textMuted, marginLeft: 3 }}>{nota ?? 5}.0</Text>
    </View>
  );
}

function CardPsicologo({ item, onPress, colors, Spacing, FontSize, BorderRadius, Shadow }) {
  const precoFinal = item.precoSessao
    ? `R$ ${(parseFloat(item.precoSessao) * (1 + TAXA)).toFixed(2).replace('.', ',')}`
    : '—';

  const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#06b6d4'];
  const avatarColor = AVATAR_COLORS[item.id % AVATAR_COLORS.length] ?? colors.primary;

  return (
    <TouchableOpacity
      style={[{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: avatarColor + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: avatarColor + '40' }}>
        <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: avatarColor }}>{item.nome.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }} numberOfLines={1}>{item.nome}</Text>
        <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: 5 }} numberOfLines={1}>{item.especialidade ?? 'Psicologia geral'}</Text>
        <StarRow nota={item.avaliacao} colors={colors} FontSize={FontSize} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.primary }}>{precoFinal}</Text>
        <Text style={{ fontSize: FontSize.xs, color: colors.textMuted }}>por sessão</Text>
        <View style={{ backgroundColor: colors.primarySurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, marginTop: 2 }}>
          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>Ver perfil</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PsicologosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
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
      q ? psicologos.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        (p.especialidade ?? '').toLowerCase().includes(q)
      ) : psicologos
    );
  }, [busca, psicologos]);

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Text style={s.title}>Psicólogos</Text>
        <Text style={s.subtitle}>{filtrado.length} profissionais disponíveis</Text>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nome ou especialidade..."
            placeholderTextColor={colors.textMuted}
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtrado}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <CardPsicologo
              item={item}
              onPress={() => navigation.navigate('PerfilPsicologo', { psicologo: item })}
              colors={colors}
              Spacing={Spacing}
              FontSize={FontSize}
              BorderRadius={BorderRadius}
              Shadow={Shadow}
            />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>Nenhum resultado</Text>
              <Text style={s.emptyText}>Tente buscar por outro nome ou especialidade</Text>
            </View>
          }
        />
      )}

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.background },
  header:      { backgroundColor: c.card, paddingHorizontal: Sp.lg, paddingBottom: Sp.md, borderBottomWidth: 1, borderBottomColor: c.border },
  title:       { fontSize: Fs.xxl, fontWeight: '800', color: c.textPrimary },
  subtitle:    { fontSize: Fs.sm, color: c.textMuted, marginBottom: Sp.md, marginTop: 2 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.inputBg, borderRadius: Br.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: Sp.md, height: 48 },
  searchInput: { flex: 1, fontSize: Fs.sm, color: c.textPrimary },
  list:        { padding: Sp.lg, paddingBottom: 100 },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon:   { width: 80, height: 80, borderRadius: 40, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:  { fontSize: Fs.lg, fontWeight: '700', color: c.textPrimary },
  emptyText:   { fontSize: Fs.sm, color: c.textMuted, textAlign: 'center' },
});
