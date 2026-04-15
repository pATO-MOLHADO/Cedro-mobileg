import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function CadastroScreen({ navigation }) {
  const { login } = useAuth();
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
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
      const { data: loginData } = await authService.login(form.email, form.senha);
      await login(loginData.usuarioResponse ?? newUser, loginData.token ?? 'mock_token');
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'nome',     label: 'Nome completo', icon: 'person-outline',  placeholder: 'Seu nome completo',  keyboard: 'default',       cap: 'words' },
    { key: 'email',    label: 'Email',         icon: 'mail-outline',    placeholder: 'seu@email.com',       keyboard: 'email-address', cap: 'none' },
    { key: 'telefone', label: 'Telefone',      icon: 'call-outline',    placeholder: '(11) 99999-9999',    keyboard: 'phone-pad',     cap: 'none' },
  ];

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={s.hero}>
            <View style={s.logoWrap}>
              <Ionicons name="leaf" size={30} color={colors.white} />
            </View>
            <Text style={s.heroTitle}>Criar conta</Text>
            <Text style={s.heroSub}>Comece sua jornada de bem-estar</Text>
          </View>

          <View style={s.card}>
            {FIELDS.map(f => (
              <View key={f.key} style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <View style={s.inputRow}>
                  <Ionicons name={f.icon} size={18} color={colors.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.cap}
                    autoCorrect={false}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                  />
                </View>
              </View>
            ))}

            <View style={s.field}>
              <Text style={s.label}>Senha</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="mín. 6 caracteres"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showSenha}
                  value={form.senha}
                  onChangeText={v => set('senha', v)}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowSenha(v => !v)}>
                  <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleCadastro} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.btnText}>Criar conta</Text>
              }
            </TouchableOpacity>

            <Text style={s.terms}>
              Ao criar conta você concorda com os{' '}
              <Text style={s.termsLink}>Termos de Uso</Text>.
            </Text>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, Sp, Fs, Br, Sh) => StyleSheet.create({
  container:  { flex: 1 },
  gradient:   { flex: 1 },
  scroll:     { flexGrow: 1, paddingHorizontal: Sp.lg, paddingTop: 50, paddingBottom: 40 },
  topBar:     { marginBottom: Sp.sm },
  backBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  hero:       { alignItems: 'center', marginBottom: Sp.xl },
  logoWrap:   { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: Sp.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  heroTitle:  { fontSize: Fs.xl, fontWeight: '800', color: c.white },
  heroSub:    { fontSize: Fs.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card:       { backgroundColor: c.surface, borderRadius: Br.xl, padding: Sp.lg, ...Sh.md },
  field:      { marginBottom: Sp.md },
  label:      { fontSize: Fs.xs, fontWeight: '600', color: c.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.inputBg, borderRadius: Br.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: Sp.md, height: 52 },
  input:      { flex: 1, fontSize: Fs.md, color: c.textPrimary },
  btn:        { backgroundColor: c.primary, borderRadius: Br.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Sp.sm, marginBottom: Sp.md },
  btnText:    { color: c.white, fontSize: Fs.md, fontWeight: '700', letterSpacing: 0.5 },
  terms:      { fontSize: Fs.xs, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
  termsLink:  { color: c.primary, fontWeight: '600' },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: Sp.xl },
  footerText: { color: 'rgba(255,255,255,0.75)', fontSize: Fs.sm },
  footerLink: { color: c.white, fontSize: Fs.sm, fontWeight: '700' },
});
