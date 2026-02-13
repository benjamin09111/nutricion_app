'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionDockItem {
    id: string;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
    isSeparator?: boolean;
}

interface ActionDockProps {
    items: ActionDockItem[];
    className?: string;
}

export function ActionDock({ items, className }: ActionDockProps) {
    return (
        <div className={cn(
            "fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 animate-in slide-in-from-right duration-500",
            className
        )}>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-4xl shadow-2xl flex flex-col gap-2">
                {items.map((item, index) => {
                    if (item.isSeparator) {
                        return <div key={`sep-${index}`} className="h-px bg-slate-100 mx-2 my-1" />;
                    }

                    const variantStyles = {
                        indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                        emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                        amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
                        rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
                        slate: "bg-slate-50 text-slate-600 hover:bg-slate-100",
                    };

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={cn(
                                "p-4 rounded-full transition-all group relative cursor-pointer",
                                variantStyles[item.variant || 'slate']
                            )}
                        >
                            <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap z-[60]">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
