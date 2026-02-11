import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { X, Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
    className?: string;
}

export function TagInput({ value = [], onChange, placeholder = "Agregar tag...", suggestions = [], className }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed) return;

        // Check for duplicates (case-insensitive)
        const isDuplicate = value.some(t => t.toLowerCase() === trimmed.toLowerCase());

        if (!isDuplicate) {
            // Format: Capitalize first letter
            const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            onChange([...value, formatted]);
            setInputValue('');
            setShowSuggestions(false);
        } else {
            // Optional: visual feedback that it exists?
            setInputValue(''); // Clear input anyway
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    // Filter suggestions
    const filteredSuggestions = suggestions.filter(
        s => !value.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("space-y-2", className)} ref={containerRef}>
            <div className="flex flex-wrap gap-2">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-in fade-in zoom-in duration-200"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center hover:bg-emerald-200 hover:text-emerald-900 transition-colors cursor-pointer"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <div className="flex gap-2">
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
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addTag(inputValue)}
                        disabled={!inputValue.trim()}
                        className="shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                        {filteredSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addTag(suggestion)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
