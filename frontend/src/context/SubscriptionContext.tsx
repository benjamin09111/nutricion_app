'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type SubscriptionPlan = 'trial' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

interface SubscriptionContextType {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    features: {
        canGenerateDiet: boolean;
        canExportPDF: boolean;
        patientLimit: number;
        hasBranding: boolean;
    };
    redeemCode: (code: string) => Promise<boolean>;
    // Dev Tool for Admin
    forceUpdatePlan: (plan: SubscriptionPlan) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Features Map
const PLAN_FEATURES = {
    trial: { canGenerateDiet: true, canExportPDF: true, patientLimit: 5, hasBranding: true },
    pro: { canGenerateDiet: true, canExportPDF: true, patientLimit: 999, hasBranding: true }
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    // MOCK: Default to 'trial'
    const [plan, setPlan] = useState<SubscriptionPlan>('trial');
    const [status, setStatus] = useState<SubscriptionStatus>('active');

    // Default trial is 7 days (1 week)
    const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
    });

    const redeemCode = async (code: string): Promise<boolean> => {
        // Mock validation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Code gives 2 weeks instead of 1
        if (code.toUpperCase().startsWith('PROMO')) {
            setPlan('trial');
            setStatus('active');
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + 14); // 2 weeks
            setTrialEndsAt(newDate);
            toast.success('¡Código canjeado! Tienes 14 días de prueba completos.');
            return true;
        }

        toast.error('Código inválido o expirado.');
        return false;
    };

    // Helper for Admins to force state
    const forceUpdatePlan = (newPlan: SubscriptionPlan) => {
        setPlan(newPlan);
        setStatus('active');
        toast.info(`[DEV] Plan cambiado a: ${newPlan.toUpperCase()}`);
    };

    const value = {
        plan,
        status,
        trialEndsAt,
        features: PLAN_FEATURES[plan] || PLAN_FEATURES.trial,
        redeemCode,
        forceUpdatePlan
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
