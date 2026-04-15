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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors, Spacing, FontSize, BorderRadius, Shadow } = useTheme();
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.login(email.trim(), senha);
      await login(data.usuarioResponse, data.token);
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Email ou senha incorretos.';
      Alert.alert('Erro ao entrar', msg);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors, Spacing, FontSize, BorderRadius, Shadow);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={[colors.primaryDark, colors.primary, colors.primaryLight]} style={s.gradient}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.hero}>
            <View style={s.logoWrap}>
              <Ionicons name="leaf" size={38} color={colors.white} />
            </View>
            <Text style={s.logoText}>Cedro</Text>
            <Text style={s.tagline}>Saúde mental acessível para todos</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Bem-vindo de volta</Text>
            <Text style={s.cardSub}>Entre na sua conta para continuar</Text>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Senha</Text>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showSenha}
                  value={senha}
                  onChangeText={setSenha}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowSenha(v => !v)}>
                  <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.forgotWrap}>
              <Text style={s.forgot}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.btnText}>Entrar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={s.demoBtn}
              onPress={() => { setEmail('demo@cedro.com'); setSenha('123456'); }}
            >
              <Ionicons name="flask-outline" size={14} color={colors.primary} />
              <Text style={s.demoText}>Usar conta demo</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={s.footerLink}>Criar conta</Text>
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
  scroll:     { flexGrow: 1, paddingHorizontal: Sp.lg, paddingTop: 70, paddingBottom: 40 },
  hero:       { alignItems: 'center', marginBottom: Sp.xl },
  logoWrap:   { width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: Sp.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  logoText:   { fontSize: 36, fontWeight: '800', color: c.white, letterSpacing: 2 },
  tagline:    { fontSize: Fs.sm, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  card:       { backgroundColor: c.surface, borderRadius: Br.xl, padding: Sp.lg, ...Sh.md },
  cardTitle:  { fontSize: Fs.xl, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  cardSub:    { fontSize: Fs.sm, color: c.textMuted, marginBottom: Sp.lg },
  field:      { marginBottom: Sp.md },
  label:      { fontSize: Fs.xs, fontWeight: '600', color: c.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.inputBg, borderRadius: Br.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: Sp.md, height: 52 },
  input:      { flex: 1, fontSize: Fs.md, color: c.textPrimary },
  forgotWrap: { alignItems: 'flex-end', marginBottom: Sp.md },
  forgot:     { fontSize: Fs.sm, color: c.primary, fontWeight: '500' },
  btn:        { backgroundColor: c.primary, borderRadius: Br.md, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: Sp.md },
  btnText:    { color: c.white, fontSize: Fs.md, fontWeight: '700', letterSpacing: 0.5 },
  demoBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Br.md, backgroundColor: c.primarySurface },
  demoText:   { fontSize: Fs.sm, color: c.primary, fontWeight: '500' },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: Sp.xl },
  footerText: { color: 'rgba(255,255,255,0.75)', fontSize: Fs.sm },
  footerLink: { color: c.white, fontSize: Fs.sm, fontWeight: '700' },
});
