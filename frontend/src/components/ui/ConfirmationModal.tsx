import { Button } from './Button';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for merging classes

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'destructive' | 'warning';
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'primary',
    isLoading = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return <AlertCircle className="h-6 w-6 text-red-600" />;
            case 'warning':
                return <AlertCircle className="h-6 w-6 text-orange-600" />;
            case 'primary':
            default:
                return <HelpCircle className="h-6 w-6 text-emerald-600" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-red-100 border-red-200';
            case 'warning':
                return 'bg-orange-100 border-orange-200';
            case 'primary':
            default:
                return 'bg-emerald-100 border-emerald-200';
        }
    };

    const getConfirmButtonClass = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200';
            case 'warning':
                return 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200';
            case 'primary':
            default:
                return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="fixed inset-0"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8 text-center space-y-6">
                    <div className={cn("mx-auto h-16 w-16 rounded-2xl flex items-center justify-center border-2", getIconBg())}>
                        {getIcon()}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">
                            {title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500">
                            {description}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-500 hover:bg-slate-100"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 h-12 rounded-xl font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2",
                                getConfirmButtonClass()
                            )}
                        >
                            {isLoading && (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
