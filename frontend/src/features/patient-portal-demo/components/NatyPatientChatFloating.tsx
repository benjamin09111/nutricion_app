"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "naty" | "user";
  text: string;
  timestamp: string;
}

interface NatyPatientChatFloatingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NatyPatientChatFloating({
  isOpen,
  onClose,
}: NatyPatientChatFloatingProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      sender: "naty",
      text: "¡Hola Camila! ¿En qué te ayudo hoy?",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Prevent background scroll while chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      scrollToBottom();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const natyMsg: ChatMessage = {
        id: `naty-${Date.now()}`,
        sender: "naty",
        text: "Soy Naty, y aún estoy en Demo, ¡ya podré responderte a lo que quieras sobre tu nutrición!",
        timestamp: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, natyMsg]);
      setIsTyping(false);
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop oscuro para enfocar la vista en el chat */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ventana de Chat amplia que aprovecha la pantalla (sin bordes redondeados arriba) */}
      <div className="relative w-full sm:max-w-lg rounded-none bg-white shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[640px] max-h-[92dvh] z-10 animate-sheet-up">
        {/* Header del Chat con Paleta NutriNet iniciando directamente arriba */}
        <div className="px-5 pt-4 pb-4 bg-gradient-to-br from-[#86A83C] via-[#668E20] to-[#5A781E] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-inner shrink-0">
              <Image
                src="/circle_logo.webp"
                alt="Naty"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-base font-bold tracking-wide leading-tight">Naty</p>
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Asistente NutriNet</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
            aria-label="Cerrar chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Historial de Mensajes Ampliado */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/50 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs",
                  msg.sender === "user"
                    ? "bg-[#86A83C] text-white rounded-tr-xs font-medium"
                    : "bg-white border border-[#E9E5E7] text-[#20212B] rounded-tl-xs font-normal"
                )}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E9E5E7] p-2.5 rounded-2xl w-fit shadow-2xs animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#86A83C] animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-slate-400 ml-1 font-medium">Naty respondiendo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input para Escribir con buen espacio en el fondo */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-[#E9E5E7] flex items-center gap-2 pb-6 sm:pb-4 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu mensaje a Naty..."
            className="flex-1 h-11 px-4 rounded-xl border border-[#E9E5E7] bg-slate-50 text-xs sm:text-sm text-[#20212B] placeholder:text-slate-400 focus:bg-white focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C] outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs",
              inputText.trim() && !isTyping
                ? "bg-[#86A83C] hover:bg-[#78A82F] text-white shadow-xs shadow-[#86A83C]/20 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
            aria-label="Enviar mensaje"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
