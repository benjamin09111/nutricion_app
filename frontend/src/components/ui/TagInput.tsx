import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Globe, User as UserIcon, Trash2 } from "lucide-react";
import { Input } from "./Input";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { fetchApi } from "@/lib/api-base";
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  fetchSuggestionsUrl?: string;
  hideTags?: boolean;
  disableDelete?: boolean; // If true, hides the delete button from suggestions dropdown
  includeSystemSuggestions?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Agregar tag...",
  suggestions = [],
  className,
  fetchSuggestionsUrl,
  hideTags = false,
  disableDelete = false,
  includeSystemSuggestions = true,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchTags = async () => {
      if (!fetchSuggestionsUrl) {
        setFetchedSuggestions([]);
        return;
      }

      // Avoid noisy network errors while auth/session is still bootstrapping
      if (!token) {
        setFetchedSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const url =
          inputValue.trim() === ""
            ? `${fetchSuggestionsUrl}?limit=6`
            : `${fetchSuggestionsUrl}?search=${encodeURIComponent(inputValue)}`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Assuming data is an array of objects { name: string } or similar based on backend/tags
          const names = Array.isArray(data)
            ? data.map((t: any) => (typeof t === "string" ? t : t.name))
            : [];
          if (isMounted) {
            setFetchedSuggestions(names);
          }
        } else if (isMounted) {
          setFetchedSuggestions([]);
        }
      } catch (error) {
        // During local testing the backend may be temporarily unavailable.
        // Keep the input usable without polluting the console for expected fetch failures.
        if (
          !(error instanceof DOMException && error.name === "AbortError") &&
          isMounted
        ) {
          setFetchedSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchTags, 300);
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [inputValue, fetchSuggestionsUrl, token]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = value.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );

    if (!isDuplicate) {
      // Format: Capitalize first letter
      const formatted =
        trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      onChange([...value, formatted]);
      setInputValue("");
      setShowSuggestions(false);
    } else {
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleDeleteGlobalTag = async (tagName: string) => {
    try {
      const response = await fetchApi(`/tags/${encodeURIComponent(tagName)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        // Remove from current selection if present
        onChange(value.filter((t) => t !== tagName));
        // Remove from fetched suggestions list
        setFetchedSuggestions((prev) => prev.filter((t) => t !== tagName));
        toast.success(`Tag "${tagName}" eliminado del sistema`);
      } else {
        const err = await response.json();
        toast.error(err.message || "No tienes permisos para eliminar este tag");
      }
    } catch (error) {
      console.error("Error deleting global tag:", error);
      toast.error("Error de conexión al eliminar tag");
    }
  };

  // Combine manual suggestions with fetched ones and system defaults
  const systemSuggestions = includeSystemSuggestions
    ? DEFAULT_CONSTRAINTS.map((c) => c.id)
    : [];
  const allMatchingSuggestions = Array.from(
    new Set([...suggestions, ...systemSuggestions, ...fetchedSuggestions]),
  ).filter(
    (s) =>
      !value.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // When search is empty, show only first 6. When searching, show all matches.
  const allSuggestions =
    inputValue.trim() === ""
      ? allMatchingSuggestions.slice(0, 6)
      : allMatchingSuggestions;

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              className={cn(
                "h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm",
                className
              )}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && allSuggestions.length > 0 && (
          <div className="fixed inset-x-4 sm:inset-x-auto sm:absolute z-50 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-72 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200 sm:w-full">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Sugerencias Globales
              </p>
            </div>
            {allSuggestions.map((suggestion) => {
              const isSystem = DEFAULT_CONSTRAINTS.some(
                (c) => c.id === suggestion,
              );
              return (
                <div
                  key={suggestion}
                  className="w-full transition-colors border-b border-slate-100 last:border-0 flex items-center group/item hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 cursor-pointer"
                    title={isSystem ? "Tag del sistema" : "Tag creado por nutri"}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        isSystem
                          ? "border-blue-100 bg-blue-50 text-blue-500"
                          : "border-emerald-100 bg-emerald-50 text-emerald-500",
                      )}
                    >
                      {isSystem ? (
                        <Globe className="w-3.5 h-3.5" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-700">
                        {suggestion}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        {isSystem ? (
                          <>
                            <Globe className="h-3 w-3" />
                            <span>Sistema</span>
                          </>
                        ) : (
                          <>
                            <UserIcon className="h-3 w-3" />
                            <span>Nutri</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                  {!isSystem && !disableDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagToDelete(suggestion);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
                      title="Eliminar tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hideTags && (
        <div className="flex flex-wrap gap-2 min-h-[20px] px-1">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-900 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={() => {
          if (tagToDelete) handleDeleteGlobalTag(tagToDelete);
          setIsDeleteConfirmOpen(false);
          setTagToDelete(null);
        }}
        title="¿Eliminar tag permanente?"
        description={`¿Estás seguro de que deseas eliminar permanentemente el tag "${tagToDelete}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
