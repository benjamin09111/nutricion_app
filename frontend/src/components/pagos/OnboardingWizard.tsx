"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  Users,
  FileText,
  Calculator,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  ShieldCheck,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  membershipService,
  type MembershipPlan,
} from "@/features/memberships/services/membership.service";
import { cn } from "@/lib/utils";
import { TransferPaymentModal } from "./TransferPaymentModal";
import { goToDashboard } from "@/lib/membership-navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import { syncMembershipToStoredUser } from "@/lib/membership-session";

const STEPS = ["Bienvenida", "Características", "Elige tu plan"];

const FEATURES = [
  {
    icon: Users,
    title: "Gestión de Pacientes",
    description: "CRM completo con historial clínico y seguimiento",
    color: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: FileText,
    title: "Entregable Personalizado",
    description: "Dieta → Recetas → Carrito → PDF profesional",
    color: "bg-indigo-50 border-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    icon: Calculator,
    title: "Calculadora Clínica",
    description: "IMC, GET, peso ideal y más, al instante",
    color: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: ShoppingCart,
    title: "Carrito Inteligente",
    description: "Lista de compras automática basada en dietas",
    color: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
  },
];

interface OnboardingWizardProps {
  nutritionistEmail: string;
  nutritionistName?: string;
}

export function OnboardingWizard({ nutritionistEmail, nutritionistName }: OnboardingWizardProps) {
  const router = useRouter();
  const { refreshSubscription } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPaidPlan, setSelectedPaidPlan] = useState<MembershipPlan | null>(null);
  const [isSubmittingFree, setIsSubmittingFree] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const activePlans = await membershipService.getActivePlans();
        setPlans(activePlans);
      } catch {
        toast.error("No se pudieron cargar los planes");
      } finally {
        setIsLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const freePlan = plans.find((p) => Number(p.price) === 0);
  const paidPlans = plans.filter((p) => Number(p.price) > 0);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSelectFree = async (plan: MembershipPlan) => {
    setIsSubmittingFree(true);
    try {
      const result = await membershipService.selectFreePlan(plan.id);
      syncMembershipToStoredUser(result.membershipStatus, plan);
      localStorage.setItem("nutri_welcome_pending", "true");
      toast.success(`Plan ${plan.name} activado correctamente`);
      await refreshSubscription();
      goToDashboard();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al activar plan");
    } finally {
      setIsSubmittingFree(false);
    }
  };

  const handleSelectPaidPlan = (plan: MembershipPlan) => {
    setSelectedPaidPlan(plan);
  };

  const handlePaymentSuccess = async () => {
    localStorage.setItem("nutri_welcome_pending", "true");
    await refreshSubscription();
    router.push("/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-200/50 mb-6">
              <Sparkles className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              ¡Bienvenido a NutriNet!
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              La plataforma diseñada para{' '}
              <span className="font-semibold text-indigo-600">nutricionistas chilenos</span> que
              quieren automatizar su flujo clínico y ahorrar tiempo.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <Star className="h-4 w-4" />
              Versión beta — Estamos construyendo contigo
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Todo lo que necesitas en un solo lugar
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                Herramientas diseñadas para tu día a día como nutricionista
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className={cn(
                    "rounded-2xl border p-6 transition-all duration-300 hover:shadow-md",
                    feature.color,
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl",
                        feature.color,
                      )}
                    >
                      <feature.icon className={cn("h-6 w-6", feature.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{feature.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 py-4">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Elige cómo quieres comenzar
              </h2>
              <p className="mt-3 text-lg text-slate-500 max-w-xl mx-auto">
                Puedes empezar gratis y hacer upgrade cuando quieras. Sin compromisos.
              </p>
            </div>

            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 max-w-3xl mx-auto">
                {freePlan && (
                  <div className="relative flex flex-col rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-col flex-1 p-6 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700 mb-4 mx-auto">
                        <Zap className="h-3.5 w-3.5" />
                        Plan gratuito
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {freePlan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-4xl font-black tracking-tight text-slate-900">
                          $0
                        </span>
                        <span className="text-slate-500 text-sm">/mes</span>
                      </div>
                      {freePlan.description && (
                        <p className="text-sm text-slate-500 mb-6">{freePlan.description}</p>
                      )}
                      <div className="mt-auto">
                        <Button
                          onClick={() => handleSelectFree(freePlan)}
                          disabled={isSubmittingFree}
                          className="w-full cursor-pointer bg-white border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-2xl transition-all duration-300 text-base"
                        >
                          {isSubmittingFree ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Activando...
                            </span>
                          ) : (
                            "Comenzar gratis"
                          )}
                        </Button>
                        <p className="mt-3 text-xs text-slate-400">
                          Podrás hacer upgrade cuando quieras
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paidPlans.map((plan) => {
                  const isPopular = plan.isPopular;
                  const isSelected = selectedPaidPlan?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col rounded-3xl transition-all duration-300",
                        isPopular
                          ? "border-2 border-indigo-500 shadow-[0_20px_60px_rgba(99,102,241,0.15)] bg-white"
                          : "border border-slate-200 bg-white hover:shadow-md",
                        isSelected && "ring-2 ring-indigo-500 ring-offset-2",
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Más Popular
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex flex-col flex-1 p-6",
                          isPopular ? "pt-10" : "pt-6",
                        )}
                      >
                        <div className="text-center mb-6">
                          <h3
                            className={cn(
                              "text-xl font-bold mb-2",
                              isPopular ? "text-indigo-700" : "text-slate-900",
                            )}
                          >
                            {plan.name}
                          </h3>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-black tracking-tight text-slate-900">
                              ${Number(plan.price).toLocaleString("es-CL")}
                            </span>
                            <span className="text-slate-500 text-sm">/mes</span>
                          </div>
                        </div>

                        <ul className="mb-6 space-y-2 text-left flex-1">
                          {(Array.isArray(plan.features)
                            ? plan.features
                            : typeof plan.features === "string"
                              ? JSON.parse(plan.features)
                              : [])?.slice(0, 4).map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check
                                className={cn(
                                  "h-4 w-4 mt-0.5 flex-shrink-0",
                                  isPopular ? "text-indigo-500" : "text-emerald-500",
                                )}
                              />
                              <span className="text-sm text-slate-600">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSelectPaidPlan(plan)}
                          disabled={isSelected}
                          className={cn(
                            "w-full cursor-pointer text-base font-semibold py-3 rounded-2xl transition-all duration-300",
                            isPopular
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                              : "bg-slate-900 hover:bg-slate-800 text-white",
                          )}
                        >
                          {isPopular ? (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Seleccionar
                            </>
                          ) : (
                            "Seleccionar"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isActive = currentStep === index;

            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isCompleted && "bg-emerald-100 text-emerald-700 border border-emerald-200",
                    isActive && "border-2 border-indigo-600 bg-indigo-50 text-indigo-600",
                    !isCompleted && !isActive && "border-2 border-slate-200 text-slate-400 bg-slate-50",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap hidden sm:block",
                    isActive && "text-indigo-600 font-semibold",
                    isCompleted && "text-slate-500",
                    !isCompleted && !isActive && "text-slate-400",
                  )}
                >
                  {step}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 min-w-[1rem] max-w-[2rem] rounded-full transition-colors",
                      completedSteps.includes(index) ? "bg-emerald-200" : "bg-slate-100",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-100/50 backdrop-blur-sm">
          {renderStepContent()}

          <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
              className={cn(
                "h-12 rounded-xl font-bold border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer",
                currentStep === 0 && "invisible",
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            {currentStep < STEPS.length - 1 && (
              <Button
                onClick={goNext}
                className="h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 cursor-pointer"
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>

      {selectedPaidPlan && (
        <TransferPaymentModal
          isOpen={!!selectedPaidPlan}
          onClose={() => setSelectedPaidPlan(null)}
          planId={selectedPaidPlan.id}
          planName={selectedPaidPlan.name}
          planPrice={Number(selectedPaidPlan.price)}
          nutritionistEmail={nutritionistEmail}
          nutritionistName={nutritionistName}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
