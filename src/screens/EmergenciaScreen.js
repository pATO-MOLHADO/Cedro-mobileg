import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

const BOT_RESPOSTAS = [
  'Estou aqui com você. Pode me contar mais sobre o que está sentindo?',
  'Respire fundo. Você não está sozinho(a) neste momento.',
  'Isso soa muito difícil. Vamos pensar juntos em como você pode se sentir melhor agora.',
  'Sua coragem de pedir ajuda é enorme. Como posso te apoiar?',
  'Se você estiver em perigo imediato, ligue para o CVV: 188 (24h, gratuito).',
  'Que tal tentarmos uma técnica de respiração? Inspire por 4 segundos, segure por 4, expire por 4.',
  'Você está fazendo a coisa certa ao buscar apoio. Conte-me mais sobre o que está acontecendo.',
  'Lembre-se: sentimentos difíceis são temporários. Estou aqui para te acompanhar.',
];

let botIdx = 0;

export default function EmergenciaScreen({ navigation }) {
  const [mensagens, setMensagens] = useState([
    {
      id: '0',
      texto: 'Olá. Estou aqui para te apoiar. Este espaço é seguro e sigiloso. Como você está se sentindo agora?',
      tipo: 'bot',
      hora: new Date(),
    },
  ]);
  const [texto, setTexto] = useState('');
  const flatRef = useRef(null);

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;

    const novaMsg = {
      id: Date.now().toString(),
      texto: t,
      tipo: 'usuario',
      hora: new Date(),
    };
    setMensagens(prev => [...prev, novaMsg]);
    setTexto('');

    setTimeout(() => {
      const resposta = {
        id: (Date.now() + 1).toString(),
        texto: BOT_RESPOSTAS[botIdx % BOT_RESPOSTAS.length],
        tipo: 'bot',
        hora: new Date(),
      };
      botIdx++;
      setMensagens(prev => [...prev, resposta]);
    }, 1200);
  };

  const formatHora = (date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }) => {
    const isBot = item.tipo === 'bot';
    return (
      <View style={[styles.balaoRow, isBot ? styles.rowBot : styles.rowUser]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="leaf" size={14} color={Colors.white} />
          </View>
        )}
        <View style={[styles.balao, isBot ? styles.balaoBot : styles.balaoUser]}>
          <Text style={[styles.balaoTexto, isBot ? styles.textoBot : styles.textoUser]}>
            {item.texto}
          </Text>
          <Text style={[styles.balaoHora, { color: isBot ? Colors.textMuted : 'rgba(255,255,255,0.7)' }]}>
            {formatHora(item.hora)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerDot} />
          <View>
            <Text style={styles.headerTitle}>Apoio em emergência</Text>
            <Text style={styles.headerSub}>Disponível 24h · gratuito</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Aviso */}
      <View style={styles.aviso}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
        <Text style={styles.avisoText}>
          Em risco imediato, ligue 188 (CVV) ou 192 (SAMU)
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={mensagens}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Como está se sentindo?"
            placeholderTextColor={Colors.textMuted}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={enviar}>
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { backgroundColor: Colors.emergency, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  backBtn:     { padding: 8 },
  headerInfo:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6BFFA0' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  headerSub:   { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  aviso:       { backgroundColor: Colors.info + '15', padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  avisoText:   { fontSize: FontSize.xs, color: Colors.info, flex: 1 },
  lista:       { padding: Spacing.md, gap: 12 },
  balaoRow:    { flexDirection: 'row', gap: 8 },
  rowBot:      { justifyContent: 'flex-start' },
  rowUser:     { justifyContent: 'flex-end' },
  botAvatar:   { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.emergency, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  balao:       { maxWidth: '78%', padding: Spacing.sm, borderRadius: BorderRadius.lg },
  balaoBot:    { backgroundColor: Colors.white, borderTopLeftRadius: 4 },
  balaoUser:   { backgroundColor: Colors.emergency, borderTopRightRadius: 4 },
  balaoTexto:  { fontSize: FontSize.md, lineHeight: 22 },
  textoBot:    { color: Colors.textPrimary },
  textoUser:   { color: Colors.white },
  balaoHora:   { fontSize: FontSize.xs, marginTop: 4, textAlign: 'right' },
  inputRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  input:       { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
  sendBtn:     { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.emergency, alignItems: 'center', justifyContent: 'center' },
});
