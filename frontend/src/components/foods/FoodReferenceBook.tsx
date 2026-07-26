"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Apple,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";

export interface FoodReferenceItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  proteins: number;
  carbs: number;
  lipids: number;
  sugars: number;
  fiber: number;
  sodium: number;
  unit: string;
  amount: number;
}

interface FoodReferenceBookProps {
  isOpen: boolean;
  onClose: () => void;
}

let catalogPromise: Promise<FoodReferenceItem[]> | null = null;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const loadCatalog = () => {
  catalogPromise ??= fetch("/data/ingredients.catalog.json")
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar el catálogo de alimentos.");
      return response.json() as Promise<FoodReferenceItem[]>;
    })
    .then((items) => items);

  return catalogPromise;
};

const formatValue = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

const nutritionItems = (food: FoodReferenceItem) => [
  ["Calorías", `${formatValue(food.calories)} kcal`, "bg-amber-50 text-amber-700"],
  ["Proteínas", `${formatValue(food.proteins)} g`, "bg-rose-50 text-rose-700"],
  ["Carbohidratos", `${formatValue(food.carbs)} g`, "bg-indigo-50 text-indigo-700"],
  ["Grasas", `${formatValue(food.lipids)} g`, "bg-emerald-50 text-emerald-700"],
  ["Azúcares", `${formatValue(food.sugars)} g`, "bg-orange-50 text-orange-700"],
  ["Fibra", `${formatValue(food.fiber)} g`, "bg-teal-50 text-teal-700"],
  ["Sodio", `${formatValue(food.sodium)} mg`, "bg-slate-100 text-slate-700"],
];

export function FoodReferenceBook({ isOpen, onClose }: FoodReferenceBookProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [catalog, setCatalog] = useState<FoodReferenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    loadCatalog()
      .then(setCatalog)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el catálogo."))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeButton = closeButtonRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, input, select");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      closeButton?.focus();
    };
  }, [isOpen, onClose]);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(catalog.map((food) => food.category))).sort((a, b) => a.localeCompare(b, "es"))],
    [catalog],
  );

  const filteredFoods = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch);
    return catalog.filter((food) => {
      const matchesSearch = !normalizedSearch || normalizeText(`${food.name} ${food.category}`).includes(normalizedSearch);
      return matchesSearch && (category === "Todas" || food.category === category);
    });
  }, [catalog, category, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / itemsPerPage));
  const visibleFoods = filteredFoods.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [category, deferredSearch]);

  if (!isOpen) return null;

  return (
    <div className="food-book-backdrop fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="food-book-title" className="food-book-dialog flex h-[min(900px,calc(100dvh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-amber-950/10 bg-[#f6f0e4] shadow-2xl outline-none sm:h-[min(820px,calc(100dvh-3rem))]">
        <header className="relative flex shrink-0 items-center justify-between border-b border-amber-900/10 bg-[#fbf7ef] px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-700 p-2.5 text-white shadow-lg shadow-emerald-900/15"><BookOpen className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">Biblioteca NutriNet</p>
              <h2 id="food-book-title" className="font-serif text-xl font-bold text-slate-900 sm:text-2xl">Manual de alimentos</h2>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar manual de alimentos" className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-amber-900/10 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="grid min-h-full gap-4 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.5fr)] lg:gap-0">
            <aside className="food-book-page flex flex-col rounded-2xl p-5 sm:p-7 lg:rounded-r-none lg:border-r lg:border-amber-900/10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div><p className="font-serif text-4xl font-bold leading-none text-emerald-900">01</p><p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/50">Índice de consulta</p></div>
                <Apple className="h-9 w-9 text-rose-500/70" strokeWidth={1.5} />
              </div>
              <p className="max-w-sm font-serif text-lg leading-relaxed text-slate-700">Una referencia visual para revisar rápidamente la composición nutricional de los alimentos oficiales.</p>
              <div className="my-8 h-px bg-amber-900/10" />
              <label className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500" htmlFor="food-book-search">Buscar alimento</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="food-book-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej: avena, manzana..." className="w-full rounded-xl border border-amber-900/10 bg-white/70 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-600/20" />
              </div>
              <label className="mb-2 mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500" htmlFor="food-book-category">Categoría</label>
              <div className="relative">
                <select id="food-book-category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full appearance-none rounded-xl border border-amber-900/10 bg-white/70 px-3 py-3 pr-9 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600/20">{catalog.length === 0 ? <option value="Todas">Cargando categorías...</option> : categories.map((item) => <option key={item}>{item}</option>)}</select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="mt-auto pt-8"><p className="font-serif text-3xl font-bold text-slate-900">{catalog.length || "—"}</p><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">alimentos oficiales</p><p className="mt-3 text-xs leading-relaxed text-slate-500">Valores expresados por {catalog[0]?.amount || 100} {catalog[0]?.unit || "g/ml"} de referencia.</p></div>
            </aside>

            <main className="food-book-page rounded-2xl p-4 sm:p-7 lg:rounded-l-none">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-amber-900/10 pb-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Catálogo oficial</p><p className="mt-1 text-sm text-slate-500">{filteredFoods.length} resultados encontrados</p></div><p className="font-serif text-3xl font-bold text-emerald-900">02</p></div>
              {isLoading ? <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-emerald-700" />Abriendo biblioteca...</div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div> : visibleFoods.length === 0 ? <div className="flex min-h-72 items-center justify-center text-center text-sm text-slate-500">No encontramos alimentos con esos filtros.</div> : <div className="space-y-2">{visibleFoods.map((food) => { const isExpanded = expandedId === food.id; return <div key={food.id} className="overflow-hidden rounded-xl border border-amber-900/10 bg-white/60"><button type="button" aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : food.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 font-serif text-sm font-bold text-emerald-700">{food.name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{food.name}</span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{food.category}</span></span><span className="hidden text-xs font-semibold text-slate-500 sm:block">{formatValue(food.calories)} kcal</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>{isExpanded && <div className="border-t border-amber-900/10 bg-[#fffdf8] px-4 pb-4 pt-3"><p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Por {food.amount} {food.unit}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{nutritionItems(food).map(([label, value, color]) => <div key={label} className={`rounded-lg px-2.5 py-2 ${color}`}><p className="text-[9px] font-black uppercase tracking-wider opacity-70">{label}</p><p className="mt-0.5 text-sm font-bold">{value}</p></div>)}</div></div>}</div>; })}</div>}
              <div className="mt-5 flex items-center justify-between border-t border-amber-900/10 pt-4"><p className="text-xs font-semibold text-slate-500">Página {page} de {totalPages}</p><div className="flex gap-2"><button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => { setPage((current) => current - 1); setExpandedId(null); }} className="rounded-xl border border-amber-900/10 p-2 text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Página siguiente" disabled={page === totalPages} onClick={() => { setPage((current) => current + 1); setExpandedId(null); }} className="rounded-xl border border-amber-900/10 p-2 text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
