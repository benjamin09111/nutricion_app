"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/current-user";
import { useSubscription } from "@/context/SubscriptionContext";
import { personalNotesService } from "@/features/personal-notes/personal-notes.service";
import type { PersonalNoteTab } from "@/features/personal-notes/types";

const POSITION_KEY = "nutri_notes_agenda_position";
const getErrorStatus = (error: unknown) => (error as { status?: number })?.status;

export function NotesAgendaWidget() {
  const { isLoading: isSubscriptionLoading, limit } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState<PersonalNoteTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [position, setPosition] = useState(() => ({ x: 0, y: 0 }));
  const [isDesktop, setIsDesktop] = useState(false);
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const saveAgainRef = useRef(false);
  const latestTabsRef = useRef(tabs);
  const savedSnapshotRef = useRef(new Map<string, string>());
  const positionRef = useRef(position);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const activeTab = tabs.find((tab) => tab.id === activeId) || tabs[0];
  const tabLimit = limit("personal_notes.tabs.limit");
  const userId = getCurrentUser()?.id || "session";
  const storageKey = `${POSITION_KEY}:${userId}`;

  useEffect(() => {
    latestTabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (stored && typeof stored.x === "number" && typeof stored.y === "number") {
        setPosition({ x: stored.x, y: stored.y });
      }
    } catch {
      // Ignore an invalid local window preference.
    }
  }, [storageKey]);

  useEffect(() => {
    const toggle = () => setIsOpen((value) => !value);
    const open = () => setIsOpen(true);
    window.addEventListener("toggle-notes-agenda", toggle);
    window.addEventListener("open-notes-agenda", open);
    return () => {
      window.removeEventListener("toggle-notes-agenda", toggle);
      window.removeEventListener("open-notes-agenda", open);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    setIsLoading(true);
    personalNotesService.list()
      .then((loadedTabs) => {
        setTabs(loadedTabs);
        setActiveId(loadedTabs[0]?.id || null);
        loadedTabs.forEach((tab) => savedSnapshotRef.current.set(tab.id, `${tab.title}\n${tab.content}`));
      })
      .catch(() => {
        loadedRef.current = false;
        toast.error("No pudimos cargar tus notas.");
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const saveTab = async (tab: PersonalNoteTab) => {
    if (!tab.editable) return;
    if (savingRef.current) {
      saveAgainRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveState("saving");
    const submittedSnapshot = `${tab.title}\n${tab.content}`;
    let didSave = false;
    try {
      const saved = await personalNotesService.update(tab, {
        title: tab.title,
        content: tab.content,
      });
      setTabs((current) => {
        const next = current.map((item) => {
          if (item.id !== saved.id) return item;
          const currentSnapshot = `${item.title}\n${item.content}`;
          if (currentSnapshot === submittedSnapshot) return saved;

          // Keep newer local typing while adopting the server version for the queued save.
          saveAgainRef.current = true;
          return { ...item, version: saved.version, updatedAt: saved.updatedAt };
        });
        latestTabsRef.current = next;
        return next;
      });
      savedSnapshotRef.current.set(saved.id, submittedSnapshot);
      didSave = true;
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      if (getErrorStatus(error) === 409) {
        toast.error("Esta nota cambió en otro dispositivo. Recarga la agenda para verla.");
      } else {
        toast.error("No pudimos guardar tu nota.");
      }
    } finally {
      savingRef.current = false;
      if (didSave && saveAgainRef.current) {
        saveAgainRef.current = false;
        const latest = latestTabsRef.current.find((item) => item.id === tab.id);
        if (latest && savedSnapshotRef.current.get(latest.id) !== `${latest.title}\n${latest.content}`) {
          void saveTab(latest);
        }
      }
    }
  };

  useEffect(() => {
    if (!activeTab || !isOpen || isLoading || !activeTab.editable) return;
    const snapshot = `${activeTab.title}\n${activeTab.content}`;
    if (savedSnapshotRef.current.get(activeTab.id) === snapshot) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void saveTab(activeTab), 900);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // Save only after changes to the active tab, not after server version updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.title, activeTab?.content]);

  const updateActive = (changes: Partial<Pick<PersonalNoteTab, "title" | "content">>) => {
    if (!activeTab?.editable) return;
    setTabs((current) => {
      const next = current.map((tab) => tab.id === activeTab.id ? { ...tab, ...changes } : tab);
      latestTabsRef.current = next;
      return next;
    });
    if (savingRef.current) saveAgainRef.current = true;
    setSaveState("idle");
  };

  const createTab = async () => {
    if (!isSubscriptionLoading && tabLimit > 0 && tabs.length >= tabLimit) {
      window.dispatchEvent(new CustomEvent("show-freemium-upgrade", {
        detail: {
          description: tabLimit === 1
            ? "Tu plan actual permite una sola pestaña en Mis notas. Mejora tu plan para crear más."
            : `Tu plan actual permite hasta ${tabLimit} pestañas en Mis notas. Mejora tu plan para crear más.`,
        },
      }));
      return;
    }

    try {
      const created = await personalNotesService.create("Sin título");
      setTabs((current) => [...current, created]);
      setActiveId(created.id);
      savedSnapshotRef.current.set(created.id, `${created.title}\n${created.content}`);
    } catch (error) {
      if (getErrorStatus(error) === 403) {
        window.dispatchEvent(new CustomEvent("show-freemium-upgrade", {
          detail: { description: "Tu plan actual permite una sola pestaña en Mis notas. Mejora tu plan para crear más." },
        }));
      } else {
        toast.error("No pudimos crear la pestaña.");
      }
    }
  };

  const removeTab = async () => {
    if (!activeTab || tabs.length === 1) {
      toast.info("Siempre debes conservar una pestaña de notas.");
      return;
    }
    if (!window.confirm("¿Eliminar esta pestaña y todo su contenido?")) return;
    try {
      await personalNotesService.remove(activeTab.id);
      const remaining = tabs.filter((tab) => tab.id !== activeTab.id);
      setTabs(remaining);
      setActiveId(remaining[0]?.id || null);
    } catch {
      toast.error("No pudimos eliminar la pestaña.");
    }
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { ...dragRef.current, x: event.clientX, y: event.clientY };
    setPosition((current) => ({
      x: Math.max(-window.innerWidth + 420, Math.min(window.innerWidth - 120, current.x + dx)),
      y: Math.max(-60, Math.min(window.innerHeight - 180, current.y + dy)),
    }));
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    localStorage.setItem(storageKey, JSON.stringify(positionRef.current));
  };

  if (!isOpen) return null;

  return (
    <section
      aria-label="Mis notas"
      className={cn(
        "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#fffdf7] shadow-[0_20px_55px_-30px_rgba(120,90,50,0.45)] transition-all duration-300 sm:inset-auto sm:top-20 sm:right-6 sm:h-[min(38rem,calc(100vh-6rem))] sm:w-[min(35rem,calc(100vw-3rem))] sm:rounded-2xl",
        "animate-in fade-in zoom-in-95",
      )}
      style={isDesktop ? { transform: `translate3d(${position.x}px, ${position.y}px, 0)` } : undefined}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none items-center justify-between border-b border-amber-100/80 bg-[#fffdf7] px-4 py-3 active:cursor-grabbing"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-900">Mis notas</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tu agenda personal</p>
          </div>
        </div>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setIsOpen(false)}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
          aria-label="Cerrar Mis notas"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-amber-100 bg-white/70 px-3 py-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveId(tab.id)} className={cn("max-w-40 shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition", tab.id === activeTab?.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700")}>
            <span className="block truncate">{tab.title}</span>
          </button>
        ))}
        <button type="button" onClick={() => void createTab()} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-emerald-300 text-emerald-600 transition hover:bg-emerald-50" aria-label="Crear nueva pestaña">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(#fffdf7,#fffdf7),repeating-linear-gradient(transparent,transparent_31px,#f1e7d5_32px)] bg-blend-multiply">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-emerald-600"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
        ) : activeTab ? (
          <>
            <div className="flex items-center gap-2 border-b border-amber-100/80 px-5 py-3">
              <input value={activeTab.title} onChange={(event) => updateActive({ title: event.target.value })} readOnly={!activeTab.editable} className="min-w-0 flex-1 bg-transparent text-lg font-black tracking-tight text-slate-800 outline-none placeholder:text-slate-300" aria-label="Título de la pestaña" />
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{activeTab.editable ? saveState === "saving" ? "Guardando" : saveState === "error" ? "No guardado" : <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Guardado</span> : "Solo lectura"}</span>
            </div>
            <textarea value={activeTab.content} onChange={(event) => updateActive({ content: event.target.value })} readOnly={!activeTab.editable} placeholder={activeTab.editable ? "Escribe aquí lo que no quieres olvidar..." : "Esta pestaña está en modo lectura con tu plan actual."} className="min-h-0 flex-1 resize-none bg-transparent px-5 py-4 text-[15px] leading-8 text-slate-700 outline-none placeholder:text-slate-400/80 read-only:cursor-not-allowed read-only:opacity-70" />
          </>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-amber-100 bg-white/80 px-4 py-3">
        <p className="text-[11px] text-slate-400">Se guarda automáticamente</p>
        <button type="button" onClick={() => void removeTab()} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50" aria-label="Eliminar pestaña">
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
      </div>
    </section>
  );
}
