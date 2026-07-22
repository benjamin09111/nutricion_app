"use client";

import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface NatyLoadingOverlayProps {
  title?: string;
  subtitle?: string;
}

export function NatyLoadingOverlay({
  title = "Naty est\u00e1 preparando...",
  subtitle,
}: NatyLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-3xl bg-white px-8 py-7 text-center shadow-2xl">
        <Image
          src="/nutria.webp"
          alt="Naty la nutria"
          width={112}
          height={112}
          className="h-28 w-28 animate-pulse object-contain"
        />
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">
          {title}
        </p>
        {subtitle && (
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        )}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando
        </div>
      </div>
    </div>
  );
}
