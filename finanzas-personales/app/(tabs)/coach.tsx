import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Subtitle, Title } from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import { colors, radius, spacing } from '../../src/theme';

const SUGGESTIONS = [
  'Dame un diagnóstico de mi semana',
  '¿Dónde se me va más la plata?',
  'Armame un plan de 3 pasos',
  '¿Cómo llego más rápido a mi meta?',
  '¿Cuánto debería apartar esta semana?',
  'Revisá mi bono del sábado y Ahora',
];

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { state, sendChat, chatting, clearChat } = useFinance();
  const [text, setText] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (state.chatHistory.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [state.chatHistory.length, chatting, keyboardOpen]);

  const onSend = async (message?: string) => {
    const payload = (message ?? text).trim();
    if (!payload) return;
    setText('');
    await sendChat(payload);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8, paddingBottom: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title>Coach IA</Title>
            <Subtitle>
              Te ayuda a regular gastos y avanzar metas con tu propio historial.
            </Subtitle>
          </View>
          {state.chatHistory.length > 0 && (
            <Pressable onPress={clearChat} style={styles.clearBtn}>
              <Text style={styles.clearText}>Limpiar</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={state.chatHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListHeaderComponent={
            state.chatHistory.length === 0 ? (
              <View style={styles.welcome}>
                <Ionicons name="sparkles" size={28} color={colors.accent} />
                <Text style={styles.welcomeTitle}>¿En qué te ayudo hoy?</Text>
                <Text style={styles.welcomeBody}>
                  Analiza tu semana, categorías, metas, efectivo en Ahora y el
                  bono del sábado. Sin API key usa el coach avanzado local; con
                  OpenAI en Ajustes, GPT con tu historial.
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      style={styles.suggestion}
                      onPress={() => onSend(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === 'user' && { color: colors.bg },
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            chatting ? (
              <View style={styles.typing}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.typingText}>Pensando…</Text>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Escribí tu consulta…"
            placeholderTextColor={colors.textDim}
            value={text}
            onChangeText={setText}
            editable={!chatting}
            multiline
            onFocus={() =>
              setTimeout(
                () => listRef.current?.scrollToEnd({ animated: true }),
                200
              )
            }
          />
          <Pressable
            style={[
              styles.send,
              (!text.trim() || chatting) && { opacity: 0.4 },
            ]}
            onPress={() => onSend()}
            disabled={!text.trim() || chatting}
          >
            <Ionicons name="send" size={18} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: spacing.md,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
    fontSize: 13,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
    flexGrow: 1,
  },
  welcome: {
    gap: 10,
    paddingVertical: 12,
  },
  welcomeTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: colors.text,
  },
  welcomeBody: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    lineHeight: 22,
  },
  suggestions: {
    gap: 8,
    marginTop: 8,
  },
  suggestion: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.accent,
    fontSize: 13,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontFamily: 'DMSans_400Regular',
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
