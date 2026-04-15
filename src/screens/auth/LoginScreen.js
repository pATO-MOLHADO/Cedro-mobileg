import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
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

  const preencherDemo = () => {
    setEmail('demo@cedro.com');
    setSenha('123456');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={36} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>Cedro</Text>
          <Text style={styles.subtitle}>Seu cuidado mental, sempre acessível</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar na conta</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showSenha}
                value={senha}
                onChangeText={setSenha}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowSenha(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        {/* Demo hint */}
        <TouchableOpacity style={styles.demoBox} onPress={preencherDemo}>
          <Ionicons name="flask-outline" size={14} color={Colors.primarySurface} />
          <Text style={styles.demoText}>Usar conta demo: demo@cedro.com / 123456</Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.footerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.primary },
  scroll:      { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header:      { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox:     { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logoText:    { fontSize: 32, fontWeight: '700', color: Colors.white, letterSpacing: 1 },
  subtitle:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card:        { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.md },
  cardTitle:   { fontSize: FontSize.xl, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.lg },
  inputGroup:  { marginBottom: Spacing.md },
  label:       { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, height: 50 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  eyeBtn:      { padding: 4 },
  btn:         { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  link:        { alignItems: 'center', marginTop: Spacing.md },
  linkText:    { color: Colors.primary, fontSize: FontSize.sm },
  demoBox:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg, opacity: 0.7 },
  demoText:    { color: Colors.primarySurface, fontSize: FontSize.xs },
  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText:  { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  footerLink:  { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
});
