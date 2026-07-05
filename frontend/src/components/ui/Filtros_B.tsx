"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Filtros_BProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export function Filtros_B({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  leftContent,
  rightContent,
  className,
}: Filtros_BProps) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", className)}>
      {leftContent && (
        <div className="flex items-center gap-2">
          {leftContent}
        </div>
      )}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="pl-2 shrink-0">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="h-10 text-sm border border-slate-200 bg-white focus-visible:border-indigo-500 placeholder:text-slate-400 font-medium"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {rightContent && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {rightContent}
        </div>
      )}
    </div>
  );
}
