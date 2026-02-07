'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AdminProvider, useAdmin } from "@/context/AdminContext";

import { SubscriptionProvider } from "@/context/SubscriptionContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isAdminView, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white">
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                {isAdminView ? <AdminSidebar /> : <Sidebar />}
            </div>

            <div className="lg:pl-72 h-full min-h-screen flex flex-col transition-all duration-300">
                <Navbar />
                <main className={`flex-1 py-10 ${isAdminView ? 'bg-indigo-50/10' : ''}`}>
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminProvider>
            <SubscriptionProvider>
                <DashboardContent>
                    {children}
                </DashboardContent>
            </SubscriptionProvider>
        </AdminProvider>
    );
}
