import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { mensagensService } from '../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export default function ChatPsicologoScreen({ navigation, route }) {
  const { psicologo } = route.params ?? {};
  const { user }      = useAuth();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const flatRef = useRef(null);

  useEffect(() => {
    // Carrega histórico
    mensagensService.listar(psicologo?.id)
      .then(({ data }) => {
        if (Array.isArray(data)) setMensagens(data);
      })
      .catch(() => {});
  }, [psicologo?.id]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto('');
    setEnviando(true);

    const nova = {
      id: Date.now().toString(),
      conteudo: t,
      remetenteId: user?.id,
      dataCriacao: new Date().toISOString(),
    };
    setMensagens(prev => [...prev, nova]);

    try {
      await mensagensService.enviar(psicologo?.id, t);
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Verifique seus créditos.');
      setMensagens(prev => prev.filter(m => m.id !== nova.id));
      setTexto(t);
    } finally {
      setEnviando(false);
    }
  };

  const isUser = (msg) => msg.remetenteId === user?.id;

  const renderItem = ({ item }) => {
    const mine = isUser(item);
    return (
      <View style={[styles.balaoRow, mine && styles.balaoRowUser]}>
        <View style={[styles.balao, mine ? styles.balaoUser : styles.balaoOther]}>
          <Text style={mine ? styles.textoUser : styles.textoOther}>{item.conteudo}</Text>
          {item.dataCriacao && (
            <Text style={[styles.hora, { color: mine ? 'rgba(255,255,255,0.7)' : Colors.textMuted }]}>
              {new Date(item.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarLetter}>{psicologo?.nome?.charAt(0) ?? 'P'}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{psicologo?.nome ?? 'Psicólogo'}</Text>
            <Text style={styles.headerSub}>{psicologo?.especialidade ?? ''}</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Aviso de créditos */}
      <View style={styles.creditoAviso}>
        <Ionicons name="wallet-outline" size={14} color={Colors.credits} />
        <Text style={styles.creditoAvisoText}>Esta sessão consome créditos do seu saldo</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatRef}
          data={mensagens}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: Spacing.md, gap: 8, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyAvatar}>
                <Text style={styles.emptyAvatarLetter}>{psicologo?.nome?.charAt(0) ?? 'P'}</Text>
              </View>
              <Text style={styles.emptyNome}>{psicologo?.nome ?? 'Psicólogo'}</Text>
              <Text style={styles.emptyText}>Inicie a conversa com {psicologo?.nome?.split(' ')[0] ?? 'o psicólogo'}</Text>
            </View>
          }
          renderItem={renderItem}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={Colors.textMuted}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  header:           { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  headerCenter:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  headerAvatarLetter: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  headerTitle:      { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  headerSub:        { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)' },
  creditoAviso:     { backgroundColor: Colors.creditsLight, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditoAvisoText: { fontSize: FontSize.xs, color: Colors.credits },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyAvatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  emptyAvatarLetter:{ fontSize: 32, fontWeight: '700', color: Colors.primary },
  emptyNome:        { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  emptyText:        { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  balaoRow:         { flexDirection: 'row' },
  balaoRowUser:     { justifyContent: 'flex-end' },
  balao:            { maxWidth: '78%', padding: 10, borderRadius: BorderRadius.lg },
  balaoUser:        { backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  balaoOther:       { backgroundColor: Colors.white, borderTopLeftRadius: 4 },
  textoUser:        { color: Colors.white, fontSize: FontSize.md, lineHeight: 22 },
  textoOther:       { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 22 },
  hora:             { fontSize: FontSize.xs, marginTop: 4, textAlign: 'right' },
  inputRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  input:            { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
  sendBtn:          { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:  { opacity: 0.5 },
});
