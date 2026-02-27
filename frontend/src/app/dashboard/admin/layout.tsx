"use client";

import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, role } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Simple client-side protection
    // In a real app, Middleware (server-side) should handle this for better security
    if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null; // Or a loading spinner
  }

  return <div className="animate-in fade-in duration-500">{children}</div>;
}
