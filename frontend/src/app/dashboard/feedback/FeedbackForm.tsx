'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, AlertCircle, CheckCircle2, MessageSquare, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const feedbackSchema = z.object({
    type: z.enum(['feedback', 'complaint', 'idea']),
    subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
    message: z.string().min(10, 'El mensaje debe ser más detallado (mínimo 10 caracteres)'),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export function FeedbackForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            type: 'feedback',
            subject: '',
            message: '',
        },
    });

    const selectedType = watch('type');

    const onSubmit = async (data: FeedbackFormData) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                ...data,
                // Map frontend types to uppercase for backend consistency if needed, 
                // though backend DTO maps string to enum.
                type: data.type.toUpperCase(),
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Error enviando feedback');
            }

            console.log('Feedback submitted:', data);
            setIsSuccess(true);
            reset();

            // Reset success message after 3 seconds
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            // Optionally set an error state to show to user
        } finally {
            setIsSubmitting(false);
        }
    };



    const typeStyles = {
        feedback: {
            wrapper: "border-emerald-500 bg-emerald-50",
            icon: "text-emerald-600",
            label: "text-emerald-900", // High contrast
            dot: "bg-emerald-500"
        },
        idea: {
            wrapper: "border-amber-500 bg-amber-50",
            icon: "text-amber-600",
            label: "text-amber-950", // High contrast (was likely too light before)
            dot: "bg-amber-500"
        },
        complaint: {
            wrapper: "border-rose-500 bg-rose-50",
            icon: "text-rose-600",
            label: "text-rose-950", // High contrast
            dot: "bg-rose-500"
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden relative">

                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-emerald-400 to-teal-500" />

                <div className="p-8 md:p-10">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            Tu opinión nos importa
                        </h3>
                        <p className="text-slate-500 text-sm font-medium">
                            Ayúdanos a mejorar NutriSaaS. Ya sea una idea brillante, un reporte de error o simplemente contarnos qué te gusta.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Type Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Tipo de Mensaje
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                                    { id: 'idea', label: 'Nueva Idea', icon: Lightbulb },
                                    { id: 'complaint', label: 'Problema', icon: AlertTriangle },
                                ].map((item) => {
                                    const isSelected = selectedType === item.id;
                                    const styles = typeStyles[item.id as keyof typeof typeStyles];

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setValue('type', item.id as FeedbackFormData['type'])}
                                            className={cn(
                                                "cursor-pointer relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-md active:scale-95",
                                                isSelected
                                                    ? styles.wrapper
                                                    : "border-slate-100 bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex flex-col items-center gap-2 text-center",
                                                isSelected ? styles.label : "text-slate-400"
                                            )}>
                                                <item.icon className={cn(
                                                    "w-6 h-6 transition-colors",
                                                    isSelected ? styles.icon : "text-slate-300"
                                                )} />
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    isSelected ? styles.label : "text-slate-500"
                                                )}>{item.label}</span>
                                            </div>
                                            {isSelected && (
                                                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${styles.dot}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.type && (
                                <p className="flex items-center text-rose-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-left-1">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {errors.type.message}
                                </p>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="space-y-1">
                            <label htmlFor="subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Asunto
                            </label>
                            <Input
                                id="subject"
                                placeholder="Resumen breve..."
                                error={errors.subject?.message}
                                {...register('subject')}
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            />
                            {errors.subject && (
                                <p className="flex items-center text-rose-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-left-1">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {errors.subject.message}
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="space-y-1">
                            <label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Detalle
                            </label>
                            <Textarea
                                id="message"
                                placeholder="Cuéntanos más detalles..."
                                rows={5}
                                error={errors.message?.message}
                                {...register('message')}
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none"
                            />
                            {errors.message && (
                                <p className="flex items-center text-rose-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-left-1">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {errors.message.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting || isSuccess}
                                className={cn(
                                    "w-full h-12 text-base font-bold shadow-lg transition-all active:scale-[0.98] cursor-pointer",
                                    isSuccess
                                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                                        : "bg-slate-900 hover:bg-slate-800 shadow-slate-300"
                                )}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                    </span>
                                ) : isSuccess ? (
                                    <span className="flex items-center gap-2 animate-in fade-in zoom-in">
                                        <CheckCircle2 className="w-5 h-5" />
                                        ¡Enviado con éxito!
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Send className="w-4 h-4" />
                                        Enviar Feedback
                                    </span>
                                )}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>

            {/* Security / Privacy Note */}
            <p className="text-center text-xs text-slate-400 mt-6 max-w-lg mx-auto">
                <LockIcon className="w-3 h-3 inline mr-1 mb-0.5" />
                Tus datos son procesados de forma segura. No compartimos tu información con terceros.
            </p>

        </div>
    );
}

function LockIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}
