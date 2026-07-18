import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FocusLikeEvent = {
  target?: unknown;
  nativeEvent?: { target?: unknown };
};

type KeyboardFormContextValue = {
  onInputFocus: (e: FocusLikeEvent) => void;
};

const KeyboardFormContext = createContext<KeyboardFormContextValue | null>(null);

/** Wire TextInput onFocus so the field scrolls just above the keyboard. */
export function useKeyboardFormFocus(): ((e: FocusLikeEvent) => void) | undefined {
  return useContext(KeyboardFormContext)?.onInputFocus;
}

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomOffset?: number;
};

type ScrollResponder = {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset: number,
    preventNegativeScrollOffset?: boolean
  ) => void;
};

/**
 * Avoids the two classic bugs:
 * - content stuck behind the keyboard
 * - form jumping too high (double KeyboardAvoiding + huge spacer)
 *
 * Android uses window resize (app.json softwareKeyboardLayoutMode=resize)
 * and scrolls the focused input into view. iOS uses light KAV + same scroll.
 */
export function KeyboardForm({
  children,
  style,
  contentContainerStyle,
  bottomOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [webInset, setWebInset] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));

    let onVv: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      onVv = () => {
        const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setWebInset(covered > 60 ? covered : 0);
        setKeyboardOpen(covered > 60);
      };
      vv.addEventListener('resize', onVv);
      vv.addEventListener('scroll', onVv);
    }

    return () => {
      show.remove();
      hide.remove();
      if (onVv && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onVv);
        window.visualViewport.removeEventListener('scroll', onVv);
      }
    };
  }, []);

  const scrollFieldAboveKeyboard = useCallback(
    (nodeHandle: number | null) => {
      if (nodeHandle == null || !scrollRef.current) return;

      const delay = Platform.OS === 'ios' ? 40 : 90;
      setTimeout(() => {
        const responder = (
          scrollRef.current as unknown as {
            getScrollResponder?: () => ScrollResponder;
          }
        ).getScrollResponder?.();

        const offset = 20 + bottomOffset + (Platform.OS === 'ios' ? insets.bottom : 0);

        if (responder?.scrollResponderScrollNativeHandleToKeyboard) {
          responder.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset, true);
          return;
        }

        // Web / fallback: keep a modest end scroll, not a full jump
        scrollRef.current?.scrollToEnd({ animated: true });
      }, delay);
    },
    [bottomOffset, insets.bottom]
  );

  const onInputFocus = useCallback(
    (e: FocusLikeEvent) => {
      const raw = e?.target ?? e?.nativeEvent?.target;
      const handle = findNodeHandle(raw as number);
      scrollFieldAboveKeyboard(handle);
    },
    [scrollFieldAboveKeyboard]
  );

  const paddingBottom =
    Platform.OS === 'web'
      ? (webInset > 0 ? webInset + 12 : 28)
      : keyboardOpen
        ? 28
        : 20;

  const scroll = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
        { paddingBottom: paddingBottom + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  );

  const wrapped =
    Platform.OS === 'ios' ? (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior="padding"
        keyboardVerticalOffset={Math.max(bottomOffset, insets.top)}
      >
        {scroll}
      </KeyboardAvoidingView>
    ) : (
      <View style={[styles.flex, style]}>{scroll}</View>
    );

  return (
    <KeyboardFormContext.Provider value={{ onInputFocus }}>
      {wrapped}
    </KeyboardFormContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
  },
});
