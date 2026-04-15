import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

export default function CadastroScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]           = useState({ nome: '', email: '', senha: '', telefone: '' });
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading]     = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCadastro = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      Alert.alert('Atenção', 'Preencha nome, email e senha.');
      return;
    }
    if (form.senha.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { data: newUser } = await authService.register(form);
      // Auto-login após cadastro
      const { data: loginData } = await authService.login(form.email, form.senha);
      await login(loginData.usuarioResponse ?? newUser, loginData.token ?? 'mock_token');
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={30} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece sua jornada de bem-estar</Text>
        </View>

        <View style={styles.card}>
          {[
            { key: 'nome',     label: 'Nome completo', icon: 'person-outline',      placeholder: 'Seu nome',            keyboard: 'default',       cap: 'words' },
            { key: 'email',    label: 'Email',         icon: 'mail-outline',         placeholder: 'seu@email.com',       keyboard: 'email-address', cap: 'none' },
            { key: 'telefone', label: 'Telefone',      icon: 'call-outline',         placeholder: '(11) 99999-9999',    keyboard: 'phone-pad',     cap: 'none' },
          ].map(f => (
            <View key={f.key} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={f.icon} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.cap}
                  autoCorrect={false}
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                />
              </View>
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="mín. 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showSenha}
                value={form.senha}
                onChangeText={v => set('senha', v)}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowSenha(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Criar conta</Text>
            }
          </TouchableOpacity>

          <Text style={styles.terms}>
            Ao criar conta você concorda com os{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text>.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.primary },
  scroll:      { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 50, paddingBottom: 40 },
  backBtn:     { marginBottom: Spacing.md },
  header:      { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox:     { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  logoText:    { fontSize: 26, fontWeight: '700', color: Colors.white },
  subtitle:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card:        { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.md },
  inputGroup:  { marginBottom: Spacing.md },
  label:       { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, height: 50 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  eyeBtn:      { padding: 4 },
  btn:         { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  terms:       { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
  termsLink:   { color: Colors.primary, fontWeight: '500' },
  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText:  { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  footerLink:  { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
});
