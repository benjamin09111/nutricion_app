import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  closeOnBackdropClick = true,
  closeOnEscape = true,
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
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 min-h-screen"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex w-full max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-[#E9E5E7] bg-white text-[#20212B] shadow-2xl relative animate-in zoom-in-95 duration-200",
          className,
        )}
      >
        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-[#20212B] transition-colors z-10 p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F0ECEE] bg-white px-6 sm:px-7 py-4 sm:py-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#20212B] tracking-tight">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs text-[#626573]">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-[#20212B] transition-colors p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-5 sm:px-7 sm:py-6 text-[#20212B]">{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(content, document.body);
}
