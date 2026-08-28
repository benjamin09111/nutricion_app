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
  ChevronDown,
  ChevronUp,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  membershipService,
  type MembershipPlan,
} from "@/features/memberships/services/membership.service";
import { sortPlansWithPopularInCenter } from "@/features/memberships/utils/sort-plans";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { cn } from "@/lib/utils";
import { TransferPaymentModal } from "./TransferPaymentModal";
import { goToDashboard } from "@/lib/membership-navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import { syncMembershipToStoredUser } from "@/lib/membership-session";
import { WizardStepper } from "@/components/shared/WizardStepper";

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

function parseFeature(feature: string) {
  const isNew = /\[Novedad\]|\[Nuevo\]|\(Novedad\)|\(Nuevo\)|^Novedad:|^Nuevo:|✨|🆕/i.test(feature);
  const cleanText = feature
    .replace(/\[Novedad\]|\[Nuevo\]|\(Novedad\)|\(Nuevo\)|^Novedad:|^Nuevo:|✨|🆕/gi, "")
    .trim();
  return { text: cleanText || feature, isNew };
}

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
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});
  const [viewingDetailsPlan, setViewingDetailsPlan] = useState<MembershipPlan | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlanIds((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

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

  const handleSelectFree = (plan?: MembershipPlan) => {
    setIsSubmittingFree(true);
    localStorage.setItem("nutri_welcome_pending", "true");
    if (plan?.id) {
      membershipService.selectFreePlan(plan.id).catch(() => {});
    }
    toast.success("¡Bienvenido a NutriNet!");
    goToDashboard();
  };

  const handleSelectPaidPlan = (plan: MembershipPlan) => {
    setSelectedPaidPlan(plan);
  };

  const handlePaymentSuccess = async () => {
    localStorage.setItem("nutri_welcome_pending", "true");
    await refreshSubscription();
    goToDashboard();
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
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllDetails((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-all cursor-pointer"
                >
                  {showAllDetails ? (
                    <>
                      <span>Mostrar vista compacta</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Ver más detalles de todos los planes</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className={cn("grid gap-6 mx-auto", plans.length > 2 ? "lg:grid-cols-3 max-w-5xl" : "lg:grid-cols-2 max-w-3xl")}>
                {freePlan && (() => {
                  const isExpanded = showAllDetails || Boolean(expandedPlanIds[freePlan.id]);
                  const allFeatures = (
                    Array.isArray(freePlan.features)
                      ? freePlan.features
                      : typeof freePlan.features === "string"
                        ? JSON.parse(freePlan.features)
                        : []
                  ) as string[];
                  const displayedFeatures = isExpanded ? allFeatures : allFeatures.slice(0, 4);

                  return (
                    <div className="relative flex flex-col rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 transition-all duration-300 hover:shadow-md pt-4">
                      <div className="flex flex-col flex-1 p-6 text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {freePlan.name.toLowerCase().includes("freemium")
                            ? "Gratis (Freemium)"
                            : freePlan.name}
                        </h3>
                        <div className="flex items-baseline justify-center gap-1 mb-4">
                          <span className="text-4xl font-black tracking-tight text-slate-900">
                            $0
                          </span>
                          <span className="text-slate-500 text-sm">/mes</span>
                        </div>
                        {freePlan.description && (
                          <p className="text-sm text-slate-500 mb-4">{freePlan.description}</p>
                        )}

                        <ul className="mb-4 space-y-2.5 text-left flex-1">
                          {displayedFeatures.map((featureStr: string, idx: number) => {
                            const featureDisplay = getMembershipFeatureDisplay(featureStr);
                            return (
                              <li key={idx} className="flex items-start gap-2.5">
                                <div
                                  className={cn(
                                    "mt-0.5 rounded-full p-0.5 shrink-0",
                                    featureDisplay.isNew
                                      ? "bg-amber-100 border border-amber-300"
                                      : featureDisplay.isExcluded
                                        ? "bg-red-100"
                                        : "bg-emerald-100",
                                  )}
                                >
                                  {featureDisplay.isNew ? (
                                    <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                                  ) : featureDisplay.isExcluded ? (
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    featureDisplay.isExcluded
                                      ? "text-slate-400 line-through"
                                      : featureDisplay.isNew
                                        ? "text-slate-900 font-bold"
                                        : "text-slate-700",
                                  )}
                                >
                                  {featureDisplay.label}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        <button
                          type="button"
                          onClick={() => setViewingDetailsPlan(freePlan)}
                          className="mb-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <span>Ver más detalles ({allFeatures.length} características)</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>

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
                  );
                })()}

                {sortPlansWithPopularInCenter(paidPlans).map((plan) => {
                  const isPopular = plan.isPopular;
                  const isComingSoon =
                    plan.isComingSoon ||
                    String(plan.slug || "").toLowerCase() === "proximamente" ||
                    String(plan.slug || "").toLowerCase() === "future";
                  const isSelected = selectedPaidPlan?.id === plan.id;
                  const isExpanded = showAllDetails || Boolean(expandedPlanIds[plan.id]);
                  const allFeatures = (
                    Array.isArray(plan.features)
                      ? plan.features
                      : typeof plan.features === "string"
                        ? JSON.parse(plan.features)
                        : []
                  ) as string[];
                  const displayedFeatures = isExpanded ? allFeatures : allFeatures.slice(0, 4);

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative flex flex-col rounded-3xl transition-all duration-300",
                        isComingSoon
                          ? "border-2 border-dashed border-amber-300 bg-amber-50/20 shadow-sm opacity-95"
                          : isPopular
                            ? "border-2 border-indigo-500 shadow-[0_20px_60px_rgba(99,102,241,0.15)] bg-white"
                            : "border border-slate-200 bg-white hover:shadow-md",
                        isSelected && "ring-2 ring-indigo-500 ring-offset-2",
                      )}
                    >
                      {isComingSoon ? (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Próximamente
                        </div>
                      ) : isPopular ? (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5" />
                          Más Popular
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "flex flex-col flex-1 p-6",
                          isPopular || isComingSoon ? "pt-10" : "pt-6",
                        )}
                      >
                        <div className="text-center mb-6">
                          <h3
                            className={cn(
                              "text-xl font-bold mb-2",
                              isComingSoon
                                ? "text-amber-800"
                                : isPopular
                                  ? "text-indigo-700"
                                  : "text-slate-900",
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

                        <ul className="mb-4 space-y-2.5 text-left flex-1">
                          {displayedFeatures.map((featureStr: string, idx: number) => {
                            const featureDisplay = getMembershipFeatureDisplay(featureStr);
                            return (
                              <li key={idx} className="flex items-start gap-2.5">
                                <div
                                  className={cn(
                                    "mt-0.5 rounded-full p-0.5 shrink-0",
                                    featureDisplay.isNew
                                      ? "bg-amber-100 border border-amber-300"
                                      : featureDisplay.isExcluded
                                        ? "bg-red-100"
                                        : isPopular
                                          ? "bg-indigo-100"
                                          : "bg-emerald-100",
                                  )}
                                >
                                  {featureDisplay.isNew ? (
                                    <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                                  ) : featureDisplay.isExcluded ? (
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                  ) : (
                                    <Check
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        isPopular ? "text-indigo-600" : "text-emerald-600",
                                      )}
                                    />
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    featureDisplay.isExcluded
                                      ? "text-slate-400 line-through"
                                      : featureDisplay.isNew
                                        ? "text-slate-900 font-bold"
                                        : "text-slate-700",
                                  )}
                                >
                                  {featureDisplay.label}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        <button
                          type="button"
                          onClick={() => setViewingDetailsPlan(plan)}
                          className="mb-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <span>Ver más detalles ({allFeatures.length} características)</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>

                        <Button
                          onClick={() => !isComingSoon && handleSelectPaidPlan(plan)}
                          disabled={isSelected || isComingSoon}
                          className={cn(
                            "w-full text-base font-semibold py-3 rounded-2xl transition-all duration-300",
                            isComingSoon
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                              : isPopular
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg cursor-pointer"
                                : "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer",
                          )}
                        >
                          {isComingSoon ? (
                            "Próximamente disponible"
                          ) : isPopular ? (
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl w-full">
        <WizardStepper
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          className="mb-10"
        />

        <div className="w-full">
          {renderStepContent()}

          <div className="flex items-center justify-between gap-4 mt-12 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
              className={cn(
                "h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer",
                currentStep === 0 && "invisible",
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            {currentStep < STEPS.length - 1 && (
              <Button
                onClick={goNext}
                className="h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer"
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
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

      {viewingDetailsPlan && (
        <PlanDetailsModal
          plan={viewingDetailsPlan}
          onClose={() => setViewingDetailsPlan(null)}
          onSelect={(plan) => {
            if (Number(plan.price) === 0) {
              handleSelectFree(plan);
            } else {
              handleSelectPaidPlan(plan);
            }
          }}
        />
      )}
    </div>
  );
}

function PlanDetailsModal({
  plan,
  onClose,
  onSelect,
}: {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSelect: (plan: MembershipPlan) => void;
}) {
  if (!plan) return null;

  const isComingSoon =
    plan.isComingSoon ||
    String(plan.slug || "").toLowerCase() === "proximamente" ||
    String(plan.slug || "").toLowerCase() === "future";

  const allFeatures = (
    Array.isArray(plan.features)
      ? plan.features
      : typeof plan.features === "string"
        ? JSON.parse(plan.features)
        : []
  ) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-3">
            {plan.isPopular ? "⭐ Plan Más Popular" : isComingSoon ? "🚀 Próximamente" : "Detalles del Plan"}
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {plan.name.toLowerCase().includes("freemium") ? "Gratis (Freemium)" : plan.name}
          </h3>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-black text-slate-900">
              ${Number(plan.price).toLocaleString("es-CL")}
            </span>
            <span className="text-slate-500 text-sm">/mes</span>
          </div>
          {plan.description && (
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{plan.description}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Características del plan ({allFeatures.length})
          </h4>
          <ul className="space-y-2.5">
            {allFeatures.map((featureStr, idx) => {
              const featureDisplay = getMembershipFeatureDisplay(featureStr);
              return (
                <li key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div
                    className={cn(
                      "mt-0.5 rounded-full p-1 shrink-0",
                      featureDisplay.isNew
                        ? "bg-amber-100 border border-amber-300"
                        : featureDisplay.isExcluded
                          ? "bg-red-100"
                          : "bg-emerald-100",
                    )}
                  >
                    {featureDisplay.isNew ? (
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                    ) : featureDisplay.isExcluded ? (
                      <X className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium leading-snug",
                      featureDisplay.isExcluded
                        ? "text-slate-400 line-through"
                        : featureDisplay.isNew
                          ? "text-slate-900 font-bold"
                          : "text-slate-700",
                    )}
                  >
                    {featureDisplay.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold border-slate-200">
            Cerrar
          </Button>
          {!isComingSoon && (
            <Button
              onClick={() => {
                onClose();
                onSelect(plan);
              }}
              className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Seleccionar plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
