import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { creditosService } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

function ItemExtrato({ item }) {
  const isCredito = item.tipo === 'credito';
  const valor = Math.abs(item.valor);
  const data  = new Date(item.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: isCredito ? Colors.success + '18' : Colors.error + '18' }]}>
        <Ionicons
          name={isCredito ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
          size={22}
          color={isCredito ? Colors.success : Colors.error}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemDesc}>{item.descricao}</Text>
        <Text style={styles.itemData}>{data}</Text>
      </View>
      <Text style={[styles.itemValor, { color: isCredito ? Colors.success : Colors.error }]}>
        {isCredito ? '+' : '-'}{valor} cr
      </Text>
    </View>
  );
}

export default function ExtratoScreen({ navigation }) {
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();
  const [extrato, setExtrato]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await creditosService.extrato(user?.id);
      setExtrato(Array.isArray(data) ? data : []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extrato de créditos</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={extrato}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ItemExtrato item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma movimentação encontrada</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingBottom: 14 },
  headerTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  list:        { padding: Spacing.lg, gap: 10, paddingBottom: 40 },
  item:        { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, ...Shadow.sm },
  itemIcon:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  itemDesc:    { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  itemData:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  itemValor:   { fontSize: FontSize.md, fontWeight: '700' },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:   { fontSize: FontSize.md, color: Colors.textMuted },
});
