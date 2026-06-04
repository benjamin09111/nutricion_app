"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "promo";

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
  addNotification: (
    notification: Omit<Notification, "id" | "date" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const MAX_STORAGE = 50;
const MAX_UNREAD_DISPLAY = 10;
const STORAGE_KEY = "NutriNet_notifications";

type ServerNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  date: string | Date;
  read: boolean;
};

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getToken = () => {
    return Cookies.get("auth_token") || localStorage.getItem("auth_token");
  };

  const persistNotifications = (value: Notification[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };

  const normalizeServerNotifications = (items: ServerNotification[]) =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      date: new Date(item.date).toISOString(),
      read: item.read,
      link: item.link || undefined,
    }));

  const loadFromStorage = (seedIfEmpty = false) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      if (!seedIfEmpty) {
        setNotifications([]);
        persistNotifications([]);
        return;
      }

      const initialData: Notification[] = [
        {
          id: "1",
          title: "¡Bienvenido a NutriNet!",
          message: "Explora las nuevas funcionalidades de tu dashboard.",
          type: "info",
          date: new Date().toISOString(),
          read: false,
        },
      ];
      setNotifications(initialData);
      persistNotifications(initialData);
      return;
    }

    try {
      setNotifications(JSON.parse(stored));
    } catch (e) {
      console.error("Error loading notifications", e);
    }
  };

  const loadFromServer = async () => {
    const token = getToken();
    if (!token) {
      loadFromStorage(true);
      return;
    }

    try {
      const response = await fetchApi("/notifications/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        loadFromStorage(false);
        return;
      }

      const data: { notifications?: ServerNotification[] } = await response.json();
      const serverNotifications = normalizeServerNotifications(data.notifications || []);

      setNotifications(serverNotifications);
      persistNotifications(serverNotifications);
    } catch (error) {
      console.error("Error loading notifications", error);
      loadFromStorage(false);
    }
  };

  useEffect(() => {
    void loadFromServer();
  }, []);

  useEffect(() => {
    persistNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const handleFocus = () => {
      void loadFromServer();
    };

    window.addEventListener("focus", handleFocus);
    const interval = window.setInterval(() => {
      void loadFromServer();
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Computed notifications for display
  const displayNotifications = (() => {
    const unread = notifications
      .filter((n) => !n.read)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_UNREAD_DISPLAY);

    const read = notifications
      .filter((n) => n.read)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return [...unread, ...read];
  })();

  const addNotification = (
    data: Omit<Notification, "id" | "date" | "read">,
  ) => {
    const newNotification: Notification = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      // Prune if exceeds storage limit, keeping most recent
      return updated.slice(0, MAX_STORAGE);
    });
    toast.success("Notificación recibida");
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistNotifications(updated);
      return updated;
    });

    const token = getToken();
    if (token) {
      void fetchApi(`/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((error) => console.error("Error marking notification read", error));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistNotifications(updated);
      return updated;
    });

    const token = getToken();
    if (token) {
      void fetchApi(`/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((error) => console.error("Error marking notifications read", error));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persistNotifications(updated);
      return updated;
    });

    const token = getToken();
    if (token) {
      void fetchApi(`/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((error) => console.error("Error deleting notification", error));
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications: displayNotifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
