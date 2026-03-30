import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

export default function PerfilScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [editando, setEditando] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({
    nome:     user?.nome     ?? '',
    email:    user?.email    ?? '',
    telefone: user?.telefone ?? '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      Alert.alert('Atenção', 'Nome e email são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      await authService.updatePerfil(form);
      await updateUser(form);
      setEditando(false);
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const FIELDS = [
    { key: 'nome',     label: 'Nome',     icon: 'person-outline',   keyboard: 'default',       cap: 'words' },
    { key: 'email',    label: 'Email',    icon: 'mail-outline',      keyboard: 'email-address', cap: 'none' },
    { key: 'telefone', label: 'Telefone', icon: 'call-outline',      keyboard: 'phone-pad',     cap: 'none' },
  ];

  const MENU = [
    { icon: 'wallet-outline',      label: 'Meus créditos e planos', onPress: () => navigation.navigate('Créditos') },
    { icon: 'calendar-outline',    label: 'Minhas sessões',          onPress: () => navigation.navigate('Sessões') },
    { icon: 'receipt-outline',     label: 'Extrato de créditos',     onPress: () => navigation.navigate('Extrato') },
    { icon: 'lock-closed-outline', label: 'Alterar senha',           onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user?.nome?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.userName}>{user?.nome}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Dados pessoais */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dados pessoais</Text>
            <TouchableOpacity
              onPress={() => editando ? handleSalvar() : setEditando(true)}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={styles.editBtn}>{editando ? 'Salvar' : 'Editar'}</Text>
              }
            </TouchableOpacity>
          </View>

          {FIELDS.map(f => (
            <View key={f.key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {editando ? (
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon} size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.cap}
                    autoCorrect={false}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              ) : (
                <Text style={styles.fieldValue}>{form[f.key] || '—'}</Text>
              )}
            </View>
          ))}

          {editando && (
            <TouchableOpacity style={styles.cancelEdit} onPress={() => setEditando(false)}>
              <Text style={styles.cancelEditText}>Cancelar edição</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conta</Text>
          {MENU.map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, { marginBottom: Spacing.xl }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.error + '15' }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Sair da conta</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingHorizontal: Spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar:        { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarLetter:  { fontSize: 38, fontWeight: '700', color: Colors.white },
  userName:      { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  userEmail:     { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  card:          { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle:     { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  editBtn:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  fieldGroup:    { marginBottom: Spacing.md },
  fieldLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue:    { fontSize: FontSize.md, color: Colors.textPrimary },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 46, backgroundColor: Colors.primarySurface },
  input:         { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  cancelEdit:    { alignItems: 'center', paddingVertical: 8 },
  cancelEditText:{ fontSize: FontSize.sm, color: Colors.textMuted },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
});
