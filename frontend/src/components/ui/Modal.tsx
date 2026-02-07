import { XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Close on click outside (backdrop)
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={cn(
                    "bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200",
                    className
                )}
            >
                {title && (
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
