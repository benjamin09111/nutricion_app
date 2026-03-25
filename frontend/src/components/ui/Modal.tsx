import { XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnBackdropClick = false,
  closeOnEscape = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose();
    };

    if (isOpen && closeOnEscape) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Close on click outside (backdrop)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (
      closeOnBackdropClick &&
      modalRef.current &&
      !modalRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 min-h-screen"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 relative",
          className,
        )}
      >
        {!title && (
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors z-10 p-1 hover:bg-rose-50 rounded-lg"
            >
              <XCircle className="h-6 w-6" />
          </button>
        )}
        {title && (
          <div className="px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-rose-500 transition-colors p-1 hover:bg-rose-50 rounded-lg"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
