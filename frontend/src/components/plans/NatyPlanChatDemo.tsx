"use client";

import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import { useState, type PointerEvent } from "react";

interface NatyPlanChatDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NatyPlanChatDemo({ isOpen, onClose }: NatyPlanChatDemoProps) {
  const [position, setPosition] = useState(() => ({
    x: typeof window === "undefined" ? 24 : Math.max(16, window.innerWidth - 390),
    y: 120,
  }));
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const width = 360;
    const height = 230;
    const maxX = typeof window === "undefined" ? position.x : window.innerWidth - width - 12;
    const maxY = typeof window === "undefined" ? position.y : window.innerHeight - height - 12;
    setPosition({
      x: Math.min(Math.max(12, event.clientX - dragOffset.x), Math.max(12, maxX)),
      y: Math.min(Math.max(12, event.clientY - dragOffset.y), Math.max(12, maxY)),
    });
  };

  return (
    <div
      className="fixed z-[210] w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(false)}
        className="flex cursor-grab touch-none items-center justify-between gap-3 bg-gradient-to-r from-violet-700 to-fuchsia-500 px-4 py-3 text-white active:cursor-grabbing"
      >
        <div className="flex items-center gap-3">
          <Image src="/circle_logo.webp" alt="Naty" width={42} height={42} className="h-10 w-10 rounded-full border-2 border-white/70 object-contain" />
          <div>
            <p className="text-sm font-black">Naty</p>
            <p className="text-[10px] font-semibold text-violet-100">Asistente del plan</p>
          </div>
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="Cerrar chat de Naty"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4 bg-[#fbf8ff] p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <MessageCircle className="h-4 w-4" />
          </div>
          <p className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-violet-100">
            Más adelante podré ayudarte en tiempo real, paso a paso y podrás consultarme lo que sea!
          </p>
        </div>
      </div>
    </div>
  );
}
