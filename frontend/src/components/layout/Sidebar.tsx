'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Utensils,
    Apple,
    ChefHat,
    ShoppingCart,
    CalendarDays,
    FileText,
    MessageCircle,
    ClipboardCheck,
    MessageSquare,
    Lock,
    PlayCircle,
    Folder,
    Dumbbell,
    Bot,
    Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
    name: string;
    href: string;
    icon: React.ElementType;
    disabled?: boolean;
    locked?: boolean;
}

interface SidebarGroup {
    title: string;
    items: SidebarItem[];
}

const groups: SidebarGroup[] = [
    {
        title: 'General',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Pacientes', href: '/dashboard/pacientes', icon: Users },
            { name: 'Mis Consultas', href: '/dashboard/consultas', icon: CalendarDays },
            { name: 'Ingredientes', href: '/dashboard/alimentos', icon: Apple },
            { name: 'Platos', href: '/dashboard/platos', icon: Utensils, locked: true }, // Locked as requested
            { name: 'Mis Creaciones', href: '/dashboard/creaciones', icon: Folder },
            { name: 'Detalles', href: '/dashboard/detalles', icon: FileText },
        ]
    },
    {
        title: 'Principal',
        items: [
            { name: 'Dieta', href: '/dashboard/dieta', icon: Utensils },
            { name: 'Carrito', href: '/dashboard/carrito', icon: ShoppingCart },
            { name: 'Fitness', href: '/dashboard/fitness', icon: Dumbbell, locked: true },
            { name: 'Entregable', href: '/dashboard/entregable', icon: ClipboardCheck },
        ]
    },
    {
        title: 'Herramientas',
        items: [
            { name: 'Recursos', href: '/dashboard/recursos', icon: FileText },
            { name: 'Agentes (IA)', href: '/dashboard/agentes', icon: Bot },
        ]
    },
    {
        title: 'Ajustes',
        items: [
            { name: 'Notificaciones', href: '/dashboard/ajustes/notificaciones', icon: Bell },
            { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();


    return (
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-slate-200 bg-white px-4 pb-4 h-full">
            <div className="flex h-16 shrink-0 items-center pl-2">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center">
                        <span className="font-bold text-white text-lg">N</span>
                    </div>
                    <span className="text-xl font-bold tracking-wide text-slate-900">NutriSaaS</span>
                </div>
            </div>
            <nav className="flex flex-1 flex-col mt-2">
                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    {groups.map((group) => (
                        <li key={group.title}>
                            <div className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-2">
                                {group.title}
                            </div>
                            <ul role="list" className="-mx-2 space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    const isLocked = item.locked;

                                    if (isLocked) {
                                        return (
                                            <li key={item.name}>
                                                <div className="group flex justify-between gap-x-3 rounded-md p-1.5 leading-5 font-medium text-slate-400 cursor-not-allowed opacity-70">
                                                    <div className="flex gap-x-2 items-center">
                                                        <item.icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                                                        {item.name}
                                                    </div>
                                                    <Lock className="h-3 w-3 text-slate-400" />
                                                </div>
                                            </li>
                                        )
                                    }

                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    isActive
                                                        ? 'bg-slate-50 text-emerald-600 font-bold'
                                                        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50 font-medium',
                                                    'group flex gap-x-2 rounded-md p-2 leading-5 transition-colors items-center cursor-pointer'
                                                )}
                                            >
                                                <item.icon
                                                    className={cn(
                                                        isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600',
                                                        'h-4 w-4 shrink-0'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>


            </nav>
        </div>
    );
}
