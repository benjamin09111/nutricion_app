import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ModuleRightNav } from './ModuleRightNav';
import { ActionDockItem } from '@/components/ui/ActionDock';
import { cn } from '@/lib/utils'; // Ensure cn is imported

interface StepIndicator {
    number: number | string;
    label: string;
    icon?: LucideIcon;
    color?: string; // e.g. "text-emerald-600", "bg-emerald-100"
}

interface ModuleLayoutProps {
    title: string;
    description: string;
    step?: StepIndicator;
    rightNavItems?: ActionDockItem[];
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function ModuleLayout({
    title,
    description,
    step,
    rightNavItems,
    footer,
    children,
    className
}: ModuleLayoutProps) {
    return (
        <div className={cn("max-w-5xl mx-auto space-y-8 pb-32 relative", className)}>
            <div className="space-y-4">
                <div className="space-y-1">
                    {step && (
                        <div className={`flex items-center gap-2 text-[10px] bg-white w-fit px-2 py-1 rounded-full border border-slate-100 shadow-sm uppercase tracking-widest font-black ${step.color ? step.color : 'text-emerald-600'}`}>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${step.color ? step.color.replace('text-', 'bg-').replace('600', '100') : 'bg-emerald-100'} mr-2`}>
                                ETAPA {step.number}
                            </span>
                            {step.label}
                            {step.icon && <step.icon className="h-3 w-3 ml-2" />}
                        </div>
                    )}
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-slate-500 font-medium">{description}</p>
                </div>

                {/* Right Navigation */}
                {rightNavItems && <ModuleRightNav items={rightNavItems} />}
            </div>

            {/* Main Content */}
            {children}

            {/* Footer - Fixed at bottom */}
            {footer && (
                <div className="fixed bottom-0 left-0 lg:left-72 right-0 z-40">
                    {footer}
                </div>
            )}
        </div>
    );
}
