'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'promo';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    date: string;
    read: boolean;
    link?: string;
}

interface NotificationsContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 1. Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('nutrisaas_notifications');
        if (stored) {
            try {
                setNotifications(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading notifications', e);
            }
        } else {
            // Initial seed data for demo
            const initialData: Notification[] = [
                {
                    id: '1',
                    title: '¡Bienvenido a NutriSaaS!',
                    message: 'Explora las nuevas funcionalidades de tu dashboard.',
                    type: 'info',
                    date: new Date().toISOString(),
                    read: false
                }
            ];
            setNotifications(initialData);
            localStorage.setItem('nutrisaas_notifications', JSON.stringify(initialData));
        }
    }, []);

    // 2. Persist to localStorage on change
    useEffect(() => {
        if (notifications.length > 0) {
            localStorage.setItem('nutrisaas_notifications', JSON.stringify(notifications));
        }
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (data: Omit<Notification, 'id' | 'date' | 'read'>) => {
        const newNotification: Notification = {
            ...data,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            read: false,
        };

        setNotifications(prev => [newNotification, ...prev]);
        toast.success('Notificación enviada correctamente');
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
