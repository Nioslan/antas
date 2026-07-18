import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type KeyboardFormContextValue = {
  ensureVisible: () => void;
};

const KeyboardFormContext = createContext<KeyboardFormContextValue | null>(null);

/** Call from TextInput onFocus to scroll the form above the keyboard. */
export function useKeyboardFormFocus() {
  return useContext(KeyboardFormContext)?.ensureVisible;
}

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomOffset?: number;
  offset?: number;
};

/**
 * Keeps the focused field just above the keyboard (not way above).
 * Android: window already resizes (softwareKeyboardLayoutMode), so we only scroll.
 * iOS: light KeyboardAvoidingView + small padding.
 */
export function KeyboardForm({
  children,
  style,
  contentContainerStyle,
  bottomOffset = 0,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

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

  const ensureVisible = useCallback(() => {
    // One gentle scroll so the last fields sit just above the keyboard
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 60 : 120);
  }, []);

  useEffect(() => {
    if (keyboardOpen) ensureVisible();
  }, [keyboardOpen, ensureVisible]);

  const scroll = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
        { paddingBottom: keyboardOpen ? 16 : 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      {children}
      {/* Small cushion only — not a full keyboard-height spacer */}
      <View style={{ height: keyboardOpen ? 12 : 8 }} />
    </ScrollView>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardFormContext.Provider value={{ ensureVisible }}>
        <KeyboardAvoidingView
          style={[styles.flex, style]}
          behavior="padding"
          keyboardVerticalOffset={bottomOffset}
        >
          {scroll}
        </KeyboardAvoidingView>
      </KeyboardFormContext.Provider>
    );
  }

  return (
    <KeyboardFormContext.Provider value={{ ensureVisible }}>
      <View style={[styles.flex, style]}>{scroll}</View>
    </KeyboardFormContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
  },
});
