import React from "react";
import { cn } from "@/lib/utils";

interface ModuleFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModuleFooter({ children, className }: ModuleFooterProps) {
  return (
    <div
      className={cn(
        "w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="w-full mx-auto p-4 flex justify-between items-center gap-3 px-4 md:px-8">
        {children}
      </div>
    </div>
  );
}
