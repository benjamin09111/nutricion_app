"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Trash2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCopilotChat } from "@/features/copilot/useCopilotChat";

export function CopilotPanel() {
  const { messages, sendMessage, isStreaming, clearMessages } = useCopilotChat();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 cursor-pointer"
        title="Abrir Copiloto Clinico"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-indigo-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bot className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Copiloto Clinico</h3>
            <p className="text-xs text-slate-500">Impulsado por IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            title="Limpiar chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 px-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-slate-900 font-semibold">Hola, soy tu Copiloto Clinico</p>
            <p className="text-sm text-slate-500">
              Preguntame sobre alimentos, recetas, restricciones o calculos nutricionales para tus pacientes.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {[
                "Dame ideas de desayuno sin lactosa",
                "Calcula los macros de un plato",
                "Que alimentos evitar con diabetes?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isStreaming}
                  className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-800 rounded-bl-md"
              }`}
            >
              {msg.content || (
                <span className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Pensando...
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta al copiloto..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
