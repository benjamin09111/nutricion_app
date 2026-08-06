"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, FileText, Download, Trash2, Eye, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { UsageLimitBadge } from "@/components/shared/UsageLimitBadge";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import type { Patient } from "@/features/patients";
import { useSubscription } from "@/context/SubscriptionContext";

import { TestSelectorPanel } from "@/features/screening-tests/components/TestSelectorPanel";
import { ScreeningTestModal } from "@/features/screening-tests/components/ScreeningTestModal";
import { downloadScreeningTestPdf } from "@/features/pdf/screeningTestPdfExport";
import { suggestTestType } from "@/features/screening-tests";
import { getTestDefinition } from "@/features/screening-tests/definitions";
import type {
  ScreeningTestType,
  PatientAutoFillData,
  ScreeningTestCreationContent,
} from "@/features/screening-tests";

interface PatientTestsTabProps {
  patient: Patient;
  clinicalRecordDraft?: any;
}

interface SavedTestRecord {
  id: string;
  name: string;
  testType: string;
  testShortName: string;
  category: string;
  color: string;
  score: string;
  createdAt: string;
  rawContent: ScreeningTestCreationContent;
}

export function PatientTestsTab({ patient, clinicalRecordDraft }: PatientTestsTabProps) {
  const { can, limit, plan } = useSubscription();
  const isFreemium = plan === "free";
  const testsLocked = !isFreemium && !can("screening_tests.access");
  const configuredTestLimit = limit("screening_tests.saved.limit");
  const testLimit = isFreemium && configuredTestLimit === 0 ? 2 : configuredTestLimit;
  const canDeleteTests = can("screening_tests.delete.access");

  const [tests, setTests] = useState<SavedTestRecord[]>([]);
  const [savedTestsCount, setSavedTestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeTestType, setActiveTestType] = useState<ScreeningTestType | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<SavedTestRecord | null>(null);

  // Build patient data for auto-fill
  const patientAutoFillData: PatientAutoFillData = useMemo(() => {
    const isPregnant = clinicalRecordDraft?.gynecoObstetric?.isPregnant || false;
    const pregnancyWeek = clinicalRecordDraft?.gynecoObstetric?.gestationalWeeks
      ? Number(clinicalRecordDraft.gynecoObstetric.gestationalWeeks)
      : null;

    const calfCircumference = clinicalRecordDraft?.anthropometry?.circumferences?.calf
      ? Number(clinicalRecordDraft.anthropometry.circumferences.calf)
      : null;

    const armCircumference = clinicalRecordDraft?.anthropometry?.circumferences?.arm
      ? Number(clinicalRecordDraft.anthropometry.circumferences.arm)
      : null;

    const tricipitalFold = clinicalRecordDraft?.anthropometry?.skinfolds?.tricipital
      ? Number(clinicalRecordDraft.anthropometry.skinfolds.tricipital)
      : null;

    return {
      id: patient.id,
      fullName: patient.fullName,
      weight: patient.weight,
      height: patient.height,
      age: patient.age,
      birthDate: patient.birthDate,
      gender: patient.gender,
      isPregnant,
      pregnancyWeek,
      calfCircumference,
      armCircumference,
      tricipitalFold,
    };
  }, [patient, clinicalRecordDraft]);

  const suggestedTest = useMemo(() => suggestTestType(patientAutoFillData), [patientAutoFillData]);

  // Fetch tests for this patient from creations API
  const fetchPatientTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi(`/creations?type=SCREENING_TEST`);

      if (response.ok) {
        const creations: any[] = await response.json();
        setSavedTestsCount(creations.length);
        // Filter by patientId or patientName
        const patientTests: SavedTestRecord[] = creations
          .filter(
            (c) =>
              c.metadata?.patientId === patient.id ||
              c.content?.patientId === patient.id ||
              c.metadata?.patientName?.toLowerCase() === patient.fullName.toLowerCase() ||
              c.content?.patientName?.toLowerCase() === patient.fullName.toLowerCase(),
          )
          .map((c) => {
            const content: ScreeningTestCreationContent = c.content || {};
            const res = content.result || {};
            return {
              id: c.id,
              name: c.name,
              testType: content.testType || c.metadata?.testType || "MNA",
              testShortName: c.metadata?.testShortName || content.testType || "Test",
              category: res.category || c.metadata?.category || "Normal",
              color: res.color || c.metadata?.color || "#22c55e",
              score: res.total !== undefined ? `${res.total} pts` : "N/A",
              createdAt: formatDateOnlyForLocale(c.createdAt, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              rawContent: content,
            };
          });

        setTests(patientTests);
      }
    } catch (error) {
      console.error("Error fetching patient tests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [patient.id, patient.fullName]);

  useEffect(() => {
    fetchPatientTests();
  }, [fetchPatientTests]);

  const isTestLimitReached = Number.isFinite(testLimit) && savedTestsCount >= testLimit;

  const handleSelectTest = (type: ScreeningTestType) => {
    setActiveTestType(type);
    setIsTestModalOpen(true);
    setIsSelectorOpen(false);
  };

  const handleDownloadPdf = async (testRecord: SavedTestRecord) => {
    setIsDownloadingId(testRecord.id);
    try {
      const response = await fetchApi(`/creations/${testRecord.id}`);

      if (response.ok) {
        const fullCreation = await response.json();
        await downloadScreeningTestPdf(fullCreation, false);
        toast.success("PDF descargado correctamente.");
      } else {
        toast.error("No se pudo obtener el detalle del test.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error al generar PDF del test.");
    } finally {
      setIsDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetchApi(`/creations/${itemToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Test eliminado correctamente");
        fetchPatientTests();
      } else {
        toast.error("No se pudo eliminar el test");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setItemToDelete(null);
    }
  };

  const columns: Column<SavedTestRecord>[] = [
    {
      header: "Test / Examen",
      render: (item: SavedTestRecord) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{item.name}</p>
            <p className="text-[10px] text-slate-500">{item.testShortName}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Resultado",
      render: (item: SavedTestRecord) => (
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-xs"
            style={{ backgroundColor: item.color }}
          >
            {item.category}
          </span>
          <span className="text-xs font-bold text-slate-700">{item.score}</span>
        </div>
      ),
    },
    {
      header: "Fecha de realización",
      render: (item: SavedTestRecord) => (
        <span className="text-xs text-slate-600 font-medium">{item.createdAt}</span>
      ),
    },
    {
      header: "Acciones",
      render: (item: SavedTestRecord) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTest(item)}
            className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
            title="Ver test"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadPdf(item)}
            disabled={isDownloadingId === item.id}
            className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
            title="Descargar PDF"
          >
            {isDownloadingId === item.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </Button>
          {canDeleteTests && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItemToDelete(item.id)}
              className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Tests de Tamizaje Nutricional del Paciente
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea evaluaciones para {patient.fullName} con sus datos clínicos pre-rellenados.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {Number.isFinite(testLimit) && (
            <UsageLimitBadge
              label="Tests globales"
              usage={savedTestsCount}
              limit={testLimit}
              className="justify-center"
            />
          )}
          <Button
            onClick={() => {
              if (testsLocked || isTestLimitReached) {
                window.dispatchEvent(
                  new CustomEvent("show-freemium-upgrade", {
                    detail: { feature: "Tests de tamizaje nutricional" },
                  }),
                );
                return;
              }
              setIsSelectorOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold sm:shrink-0"
          >
            {testsLocked || isTestLimitReached ? (
              <Lock className="w-4 h-4 mr-1.5" />
            ) : (
              <Plus className="w-4 h-4 mr-1.5" />
            )}
            Crear test para este paciente
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Compartir test estará disponible próximamente"
            className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
          >
            <Lock className="mr-1.5 h-4 w-4" />
            Compartir test
          </Button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <RecordsTable
          data={tests}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyState={
            <div className="p-8 text-center text-slate-500 text-xs">
              No hay tests registrados para este paciente. Usa &quot;Crear test para este paciente&quot; para comenzar.
            </div>
          }
        />
      </div>

      {/* Selector Modal */}
      <Modal
        isOpen={Boolean(selectedTest)}
        onClose={() => setSelectedTest(null)}
        title={selectedTest ? `${selectedTest.testShortName} — ${patient.fullName}` : undefined}
        className="max-w-3xl"
      >
        {selectedTest && (() => {
          const definition = getTestDefinition(selectedTest.testType as ScreeningTestType);
          const answers = selectedTest.rawContent.answers || {};
          const result = selectedTest.rawContent.result;

          return (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: `${selectedTest.color}55`, backgroundColor: `${selectedTest.color}10` }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Resultado</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-black uppercase text-white" style={{ backgroundColor: selectedTest.color }}>
                      {selectedTest.category}
                    </span>
                    <span className="text-lg font-black text-slate-900">{selectedTest.score}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-500">Realizado: {selectedTest.createdAt}</p>
              </div>

              {definition && (
                <div className="space-y-4">
                  {definition.sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                      <h3 className="border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                        {section.title}
                      </h3>
                      <div className="space-y-2">
                        {section.questions.map((question) => {
                          const value = answers[question.id];
                          const option = question.options.find((item) => item.value === value);
                          return (
                            <div key={question.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                              <p className="text-xs font-bold text-slate-700">{question.label}</p>
                              <p className="mt-1 text-xs text-slate-500">{option?.label || "Sin respuesta"}</p>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Recomendación clínica</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{result?.recommendation || "Sin recomendación registrada."}</p>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Seleccionar Test para {patient.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Los datos conocidos (IMC, edad, gestación) se pre-seleccionarán automáticamente.
                </p>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                &times;
              </button>
            </div>

            <TestSelectorPanel
              onSelect={handleSelectTest}
              locked={testsLocked}
              suggestedTest={suggestedTest}
            />
          </div>
        </div>
      )}

      {/* Screening Test Modal */}
      {activeTestType && (
        <ScreeningTestModal
          isOpen={isTestModalOpen}
          testType={activeTestType}
          onClose={() => {
            setIsTestModalOpen(false);
            setActiveTestType(null);
          }}
          patientData={patientAutoFillData}
          onSaved={fetchPatientTests}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar test de tamizaje?"
        description="Esta acción eliminará el registro del test guardado. ¿Deseas continuar?"
        confirmText="Sí, eliminar"
        variant="destructive"
      />
    </div>
  );
}
