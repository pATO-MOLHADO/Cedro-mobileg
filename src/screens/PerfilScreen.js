import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';

export default function PerfilScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const { colors, isDark, toggle, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
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
    { key: 'nome',     label: 'Nome',     icon: 'person-outline',  keyboard: 'default',       cap: 'words' },
    { key: 'email',    label: 'Email',    icon: 'mail-outline',    keyboard: 'email-address', cap: 'none' },
    { key: 'telefone', label: 'Telefone', icon: 'call-outline',    keyboard: 'phone-pad',     cap: 'none' },
  ];

  const MENU = [
    { icon: 'wallet-outline',      label: 'Créditos e planos',  onPress: () => navigation.navigate('Créditos') },
    { icon: 'calendar-outline',    label: 'Minhas sessões',     onPress: () => navigation.navigate('Sessões') },
    { icon: 'receipt-outline',     label: 'Extrato',            onPress: () => navigation.navigate('Extrato') },
    { icon: 'lock-closed-outline', label: 'Alterar senha',      onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
  ];

  const AVATAR_INITIAL = user?.nome?.charAt(0)?.toUpperCase() ?? '?';
  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{AVATAR_INITIAL}</Text>
            </View>
          </View>
          <Text style={s.userName}>{user?.nome}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.primary} />
            <Text style={s.roleText}>Paciente</Text>
          </View>
        </View>

        {/* Dados pessoais */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Dados pessoais</Text>
            <TouchableOpacity
              style={s.editBtnWrap}
              onPress={() => editando ? handleSalvar() : setEditando(true)}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : (
                  <View style={[s.editBadge, editando && { backgroundColor: colors.primary }]}>
                    <Ionicons name={editando ? 'checkmark' : 'pencil-outline'} size={14} color={editando ? colors.white : colors.primary} />
                    <Text style={[s.editBadgeText, editando && { color: colors.white }]}>{editando ? 'Salvar' : 'Editar'}</Text>
                  </View>
                )
              }
            </TouchableOpacity>
          </View>

          {FIELDS.map(f => (
            <View key={f.key} style={s.fieldGroup}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              {editando ? (
                <View style={s.inputWrap}>
                  <Ionicons name={f.icon} size={16} color={colors.textMuted} />
                  <TextInput
                    style={s.input}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.cap}
                    autoCorrect={false}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ) : (
                <Text style={s.fieldValue}>{form[f.key] || '—'}</Text>
              )}
            </View>
          ))}

          {editando && (
            <TouchableOpacity style={s.cancelEdit} onPress={() => setEditando(false)}>
              <Text style={s.cancelEditText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Preferências */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Preferências</Text>
          <View style={s.prefRow}>
            <View style={s.prefLeft}>
              <View style={[s.prefIcon, { backgroundColor: isDark ? colors.primarySurface : '#1e293b15' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={isDark ? colors.primary : '#64748b'} />
              </View>
              <View>
                <Text style={s.prefLabel}>Modo escuro</Text>
                <Text style={s.prefSub}>{isDark ? 'Ativado' : 'Desativado'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isDark ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Menu */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Conta</Text>
          {MENU.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuItem, idx === MENU.length - 1 && { borderBottomWidth: 0 }]}
              onPress={item.onPress}
            >
              <View style={s.menuIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EmergencyButton onPress={() => navigation.navigate('Emergencia')} />
    </View>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: c.background },
  scroll:         { paddingHorizontal: Sp.lg },
  avatarSection:  { alignItems: 'center', marginBottom: Sp.xl },
  avatarRing:     { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: c.primary + '40', alignItems: 'center', justifyContent: 'center', marginBottom: Sp.sm },
  avatar:         { width: 84, height: 84, borderRadius: 42, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:   { fontSize: 38, fontWeight: '800', color: c.white },
  userName:       { fontSize: Fs.xl, fontWeight: '700', color: c.textPrimary },
  userEmail:      { fontSize: Fs.sm, color: c.textMuted, marginTop: 2 },
  roleBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primarySurface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Br.full, marginTop: 8 },
  roleText:       { fontSize: Fs.xs, color: c.primary, fontWeight: '600' },
  card:           { backgroundColor: c.card, borderRadius: Br.lg, padding: Sp.md, marginBottom: Sp.md, ...Sh.sm },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.md },
  cardTitle:      { fontSize: Fs.md, fontWeight: '700', color: c.textPrimary },
  editBtnWrap:    {},
  editBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.primarySurface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Br.full },
  editBadgeText:  { fontSize: Fs.xs, color: c.primary, fontWeight: '600' },
  fieldGroup:     { marginBottom: Sp.md },
  fieldLabel:     { fontSize: Fs.xs, color: c.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue:     { fontSize: Fs.md, color: c.textPrimary, fontWeight: '500' },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.primary, borderRadius: Br.md, paddingHorizontal: Sp.md, height: 46, backgroundColor: c.inputBg },
  input:          { flex: 1, fontSize: Fs.md, color: c.textPrimary },
  cancelEdit:     { alignItems: 'center', paddingVertical: 8 },
  cancelEditText: { fontSize: Fs.sm, color: c.textMuted },
  prefRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  prefLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefIcon:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  prefLabel:      { fontSize: Fs.md, color: c.textPrimary, fontWeight: '500' },
  prefSub:        { fontSize: Fs.xs, color: c.textMuted, marginTop: 1 },
  menuItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border },
  menuIcon:       { width: 36, height: 36, borderRadius: 18, backgroundColor: c.primarySurface, alignItems: 'center', justifyContent: 'center' },
  menuLabel:      { flex: 1, fontSize: Fs.md, color: c.textPrimary },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.error + '12', borderRadius: Br.lg, padding: Sp.md, borderWidth: 1, borderColor: c.error + '30' },
  logoutText:     { fontSize: Fs.md, color: c.error, fontWeight: '600' },
});
