import React, { useState, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Card, Text, TextInput, IconButton } from "react-native-paper";
import { chat, type ChatMessage } from "../services/api";
import { theme } from "../theme";

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await chat(text, messages);
      const assistantMsg: ChatMessage = { role: "assistant", content: res.response };
      setMessages([...updated, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Erro: ${err instanceof Error ? err.message : "Falha na comunicação"}`,
      };
      setMessages([...updated, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text variant="labelSmall" style={styles.roleLabel}>
          {isUser ? "Você" : "CardioIA"}
        </Text>
        <Text variant="bodyMedium" style={isUser ? styles.userText : styles.assistantText}>
          {item.content}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="headlineMedium" style={styles.emptyIcon}>
            💬
          </Text>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Assistente Cardíaco
          </Text>
          <Text variant="bodyMedium" style={styles.emptyHint}>
            Pergunte sobre sintomas cardíacos, fatores de risco ou protocolos de
            emergência.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte sobre saúde cardíaca..."
          style={styles.input}
          dense
          disabled={loading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <IconButton
          icon={loading ? "loading" : "send"}
          mode="contained"
          onPress={handleSend}
          disabled={loading || !input.trim()}
          iconColor="#fff"
          containerColor={theme.colors.primary}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: "85%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  roleLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  userText: {
    color: "#fff",
  },
  assistantText: {
    color: "#333",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyHint: {
    color: "#888",
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    marginRight: 4,
    backgroundColor: "transparent",
  },
});
