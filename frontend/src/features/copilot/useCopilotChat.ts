"use client";

import { useState, useCallback } from "react";
import { fetchApi } from "@/lib/api-base";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseCopilotChatReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  clearMessages: () => void;
}

export function useCopilotChat(): UseCopilotChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetchApi("/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al comunicarse con el copiloto.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta del copiloto.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "text") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.content,
                  };
                }
                return updated;
              });
            } else if (parsed.type === "error") {
              throw new Error(parsed.content || "Error del copiloto.");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido.";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          updated[updated.length - 1] = {
            ...last,
            content: `Error: ${errorMessage}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendMessage, isStreaming, clearMessages };
}
