import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Plus, Globe, User as UserIcon, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  fetchSuggestionsUrl?: string; // URL to fetch suggestions from
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Agregar tag...",
  suggestions = [],
  className,
  fetchSuggestionsUrl,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

  useEffect(() => {
    const fetchTags = async () => {
      if (!fetchSuggestionsUrl) {
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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Assuming data is an array of objects { name: string } or similar based on backend/tags
          const names = Array.isArray(data)
            ? data.map((t: any) => (typeof t === "string" ? t : t.name))
            : [];
          setFetchedSuggestions(names);
        }
      } catch (error) {
        console.error("Error fetching tag suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchTags, 300);
    return () => clearTimeout(timer);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/tags/${encodeURIComponent(tagName)}`, {
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
  const systemSuggestions = DEFAULT_CONSTRAINTS.map((c) => c.id);
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
    <div className={cn("space-y-3", className)} ref={containerRef}>
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
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm"
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
          <div className="fixed sm:absolute z-50 w-full sm:w-[calc(100%+0px)] mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">
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
                  className="w-full transition-all border-b border-slate-50 last:border-0 flex items-center group/item hover:bg-emerald-50"
                >
                  <button
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className="flex-1 text-left px-5 py-3 text-sm text-slate-700 group-hover/item:text-emerald-700 font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isSystem ? (
                        <Globe className="w-3.5 h-3.5 text-blue-400 group-hover/item:text-blue-500" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-emerald-400" />
                      )}
                      {suggestion}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-lg",
                        isSystem
                          ? "text-blue-400 bg-blue-50 group-hover/item:text-blue-600 group-hover/item:bg-blue-100/50"
                          : "text-slate-300 bg-slate-50 group-hover/item:text-emerald-500 group-hover/item:bg-emerald-100/50",
                      )}
                    >
                      {isSystem ? "Sistema / Global" : "Creada por nutri"}
                    </span>
                  </button>
                  {!isSystem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar permanently "${suggestion}"?`)) {
                          handleDeleteGlobalTag(suggestion);
                        }
                      }}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
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
    </div>
  );
}
