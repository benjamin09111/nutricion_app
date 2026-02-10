'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Crown,
    Settings,
    Shield,
    Building2,
    Inbox,
    Lock,
    Bell,
    MessageSquare
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
        title: 'Principal',
        items: [
            { name: 'Admin Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Gestión',
        items: [
            { name: 'Peticiones', href: '/dashboard/admin/peticiones', icon: Inbox },
            { name: 'Clientes', href: '/dashboard/admin/nutricionistas', icon: Users },
            { name: 'Cuentas', href: '/dashboard/admin/usuarios', icon: Shield },
            { name: 'Mensajes', href: '/dashboard/admin/mensajes', icon: MessageSquare },
            { name: 'Feedback', href: '/dashboard/admin/feedback', icon: Inbox },
            { name: 'Licencias', href: '/dashboard/admin/organizaciones', icon: Building2, locked: true },
        ]
    },
    {
        title: 'Finanzas',
        items: [
            { name: 'Pagos', href: '/dashboard/admin/pagos', icon: CreditCard },
            { name: 'Membresías', href: '/dashboard/admin/membresias', icon: Crown },
        ]
    },
    {
        title: 'Configuración',
        items: [
            { name: 'Ajustes Globales', href: '/dashboard/admin/ajustes', icon: Settings, locked: true },
        ]
    }
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
                if (!token) return; // Don't fetch if no token

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${API_URL}/requests/count/pending`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const count = await res.json();
                    setPendingCount(count);
                }
            } catch (error) {
                // Silently handle fetch errors in sidebar to avoid intrusive error overlays
                console.error('Error fetching pending count:', error);
            }
        };

        fetchPendingCount();

        // Optional: Poll every 30s
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-indigo-100 bg-slate-50/50 px-4 pb-4">
            <div className="flex h-16 shrink-0 items-center pl-2">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center">
                        <span className="font-bold text-white text-lg">A</span>
                    </div>
                    <span className="text-xl font-bold tracking-wide text-indigo-900">Admin Panel</span>
                </div>
            </div>
            <nav className="flex flex-1 flex-col mt-2">
                <ul role="list" className="flex flex-1 flex-col gap-y-3">
                    {groups.map((group) => (
                        <li key={group.title}>
                            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-indigo-400 mb-1 pl-2">
                                {group.title}
                            </div>
                            <ul role="list" className="-mx-2 space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href);

                                    return (
                                        <li key={item.name}>
                                            {item.locked ? (
                                                <div
                                                    className={cn(
                                                        'text-slate-400 cursor-not-allowed opacity-60',
                                                        'group flex gap-x-2 rounded-md p-2 leading-5 font-medium items-center'
                                                    )}
                                                    title="Próximamente"
                                                >
                                                    <item.icon
                                                        className="h-4 w-4 shrink-0 text-slate-300"
                                                        aria-hidden="true"
                                                    />
                                                    <span>{item.name}</span>
                                                    <Lock className="h-3 w-3 ml-auto text-slate-300" />
                                                </div>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        isActive
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50',
                                                        'group flex gap-x-2 rounded-md p-2 leading-5 font-medium transition-colors items-center cursor-pointer'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            isActive ? 'text-indigo-700' : 'text-slate-400 group-hover:text-indigo-600',
                                                            'h-4 w-4 shrink-0'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    <span>{item.name}</span>
                                                    {item.name === 'Peticiones' && pendingCount > 0 && (
                                                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                                            {pendingCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
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
