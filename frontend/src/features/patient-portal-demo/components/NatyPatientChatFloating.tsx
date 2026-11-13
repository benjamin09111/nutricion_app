"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, X, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "naty" | "user";
  text: string;
  timestamp: string;
}

export function NatyPatientChatFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      sender: "naty",
      text: "¡Hola Camila! Soy Naty, tu compañera nutricional en NutriNet. ¿Tienes alguna pregunta sobre tu pauta de hoy o tus porciones?",
      timestamp: "Ahora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

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
        text: "Soy Naty, y aún estoy en Demo, ya podré responderte a lo que quieras!",
        timestamp: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, natyMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Botón Flotante Circular Idéntico al Dashboard de Nutricionista (Sin texto, solo su cara) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 sm:bottom-18 right-3.5 sm:right-6 z-40 inline-flex h-12 w-12 sm:h-14 sm:w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#86A83C] to-[#668E20] shadow-lg shadow-[#86A83C]/35 hover:shadow-xl transition-transform hover:scale-105 active:scale-95 border-2 border-white"
          title="Hablar con Naty"
          aria-label="Abrir chat con Naty"
        >
          <div className="absolute inset-[2.5px] overflow-hidden rounded-full border border-white/30 bg-white/10">
            <Image
              src="/circle_logo.webp"
              alt="Naty"
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs">
            <MessageCircle className="h-2.5 w-2.5 text-white" />
          </div>
        </button>
      )}

      {/* Ventana de Chat Flotante */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 sm:w-96 rounded-3xl bg-white border border-[#DDE7B8] shadow-2xl overflow-hidden flex flex-col h-[480px] max-h-[calc(100dvh-5rem)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header del Chat con Paleta NutriNet */}
          <div className="px-5 py-4 bg-gradient-to-br from-[#86A83C] via-[#668E20] to-[#5A781E] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-inner shrink-0">
                <Image
                  src="/circle_logo.webp"
                  alt="Naty"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide">Naty</p>
                <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Asistente NutriNet</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 no-scrollbar">
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
                    "p-3 rounded-2xl text-xs leading-relaxed shadow-2xs",
                    msg.sender === "user"
                      ? "bg-[#86A83C] text-white rounded-tr-xs"
                      : "bg-white border border-[#E9E5E7] text-[#20212B] rounded-tl-xs"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
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

          {/* Input para Escribir */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-[#E9E5E7] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu mensaje a Naty..."
              className="flex-1 h-10 px-3.5 rounded-xl border border-[#E9E5E7] bg-slate-50 text-xs text-[#20212B] placeholder:text-slate-400 focus:bg-white focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C] outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs",
                inputText.trim() && !isTyping
                  ? "bg-[#86A83C] hover:bg-[#78A82F] text-white shadow-xs shadow-[#86A83C]/20 active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
