"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  isClearable?: boolean;
  mode?: "date" | "birthDate";
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MONTH_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const WEEKDAY_NAMES_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

// Helper functions for date formatting without UTC timezone drift
function parseIsoDate(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

function formatIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatPrettyDate(str?: string): string | null {
  const d = parseIsoDate(str);
  if (!d) return null;
  const day = d.getDate();
  const monthStr = MONTH_SHORT_ES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthStr} ${year}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha...",
  label,
  className,
  triggerClassName,
  min,
  max,
  disabled = false,
  isClearable = true,
  mode = "date",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const componentId = useId();

  // Selected date
  const selectedDate = parseIsoDate(value);

  // Current displayed month/year in calendar
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const isBirthDate = mode === "birthDate";
  const todayIso = formatIsoDate(new Date());
  const effectiveMax = max || (isBirthDate ? todayIso : undefined);
  const minYear = min ? parseIsoDate(min)?.getFullYear() || 1900 : 1900;
  const maxYear = effectiveMax
    ? parseIsoDate(effectiveMax)?.getFullYear() || new Date().getFullYear()
    : new Date().getFullYear() + 20;
  const selectableYears = Array.from(
    { length: Math.max(0, maxYear - minYear + 1) },
    (_, index) => maxYear - index,
  );

  // Calendar math
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (day: number, isCurrentMonth: boolean, monthOffset: number = 0) => {
    const targetDate = new Date(viewYear, viewMonth + monthOffset, day);
    const iso = formatIsoDate(targetDate);

    if (min && iso < min) return;
    if (effectiveMax && iso > effectiveMax) return;

    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handlePreset = (preset: "today" | "yesterday" | "week" | "month") => {
    const now = new Date();
    let target = new Date();

    if (preset === "today") {
      target = now;
    } else if (preset === "yesterday") {
      target.setDate(now.getDate() - 1);
    } else if (preset === "week") {
      target.setDate(now.getDate() - 7);
    } else if (preset === "month") {
      target.setMonth(now.getMonth() - 1);
    }

    const iso = formatIsoDate(target);
    onChange(iso);
    setIsOpen(false);
  };

  const prettyValue = formatPrettyDate(value);

  // Generate 42 cells (6 rows x 7 days)
  const calendarCells = [];
  
  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarCells.push({ day, isCurrentMonth: false, monthOffset: -1 });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({ day, isCurrentMonth: true, monthOffset: 0 });
  }

  // Next month leading days to complete grid
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    calendarCells.push({ day, isCurrentMonth: false, monthOffset: 1 });
  }

  return (
    <div className={cn("relative inline-block w-full text-left", className)} ref={containerRef}>
      {label && (
        <label htmlFor={componentId} className="block mb-1.5 text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={componentId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-all outline-none",
          triggerClassName,
          "hover:border-indigo-300 hover:bg-slate-50/50",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10",
          isOpen && "border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100",
        )}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <CalendarIcon className={cn("h-4 w-4 shrink-0 transition-colors", value ? "text-indigo-600" : "text-slate-400")} />
          <span className={cn("truncate", !value && "text-slate-400 font-normal")}>
            {prettyValue || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isClearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Limpiar fecha"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "z-50 bg-white animate-in fade-in-50 zoom-in-95 duration-150",
            isBirthDate
              ? "fixed inset-0 overflow-y-auto p-4 sm:absolute sm:inset-auto sm:left-0 sm:mt-1.5 sm:w-72 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-3.5 sm:shadow-xl"
              : "absolute left-0 mt-1.5 w-72 rounded-2xl border border-slate-200 p-3.5 shadow-xl",
          )}
        >
          {isBirthDate && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 sm:hidden">
              <p className="text-base font-semibold text-slate-900">Fecha de nacimiento</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar selector de fecha"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {isBirthDate ? (
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Mes de nacimiento"
                  value={viewMonth}
                  onChange={(event) => setViewDate(new Date(viewYear, Number(event.target.value), 1))}
                  className="h-7 max-w-24 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  {MONTH_NAMES_ES.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
                <select
                  aria-label="Año de nacimiento"
                  value={viewYear}
                  onChange={(event) => setViewDate(new Date(Number(event.target.value), viewMonth, 1))}
                  className="h-7 w-20 rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  {selectableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-xs font-extrabold text-slate-800 tracking-tight">
                {MONTH_NAMES_ES[viewMonth]} {viewYear}
              </span>
            )}

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isBirthDate && (
            <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-slate-100 text-[11px]">
              <button
                type="button"
                onClick={() => handlePreset("today")}
                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => handlePreset("yesterday")}
                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
              >
                Ayer
              </button>
              <button
                type="button"
                onClick={() => handlePreset("week")}
                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
              >
                Hace 7d
              </button>
              <button
                type="button"
                onClick={() => handlePreset("month")}
                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
              >
                Hace 30d
              </button>
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {WEEKDAY_NAMES_ES.map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map(({ day, isCurrentMonth, monthOffset }, idx) => {
              const cellDate = new Date(viewYear, viewMonth + monthOffset, day);
              const cellIso = formatIsoDate(cellDate);
              const isSelected = value === cellIso;
              const isToday = todayIso === cellIso;
              const isDisabled = Boolean((min && cellIso < min) || (effectiveMax && cellIso > effectiveMax));

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day, isCurrentMonth, monthOffset)}
                  className={cn(
                    "h-8 w-8 text-xs font-semibold rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    !isCurrentMonth && "text-slate-300 font-normal",
                    isCurrentMonth && !isSelected && "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600",
                    isToday && !isSelected && "ring-1 ring-indigo-500 font-black text-indigo-600 bg-indigo-50/50",
                    isSelected && "bg-indigo-600 text-white shadow-sm font-bold scale-105",
                    isDisabled && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-slate-300",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
