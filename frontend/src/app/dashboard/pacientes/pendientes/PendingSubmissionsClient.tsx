"use client";

import { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Scale,
  Ruler,
  Activity,
  Heart,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';
import {
  useIntakeSubmissions,
  useIntakeSubmissionStats,
} from '@/features/patients-intake/hooks/usePatientIntake';
import type { PatientIntakeSubmission, IntakePayload } from '@/features/patients-intake/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_LABELS: Record<Status, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

function SubmissionCard({
  submission,
  onApprove,
  onReject,
  isReviewing,
}: {
  submission: PatientIntakeSubmission;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isReviewing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const payload: IntakePayload = submission.payload || {};

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center gap-4 p-5"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600 border border-indigo-100">
          {payload.fullName?.charAt(0) ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {payload.fullName}
            </h3>
            <span
              className={cn(
                'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest',
                submission.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  : submission.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
              )}
            >
              {submission.status === 'PENDING' && <Clock className="h-3 w-3" />}
              {submission.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
              {submission.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
              {STATUS_LABELS[submission.status as Status]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {payload.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {payload.email}
              </span>
            )}
            {payload.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {payload.phone}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3" />
              {format(new Date(submission.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {payload.gender && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sexo</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{payload.gender}</p>
              </div>
            )}
            {payload.birthDate && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nacimiento</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  {format(new Date(payload.birthDate), 'dd/MM/yyyy')}
                </p>
              </div>
            )}
            {payload.height && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <Ruler className="h-3 w-3 inline mr-1" />
                  Altura
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{payload.height} cm</p>
              </div>
            )}
            {payload.weight && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <Scale className="h-3 w-3 inline mr-1" />
                  Peso
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{payload.weight} kg</p>
              </div>
            )}
            {payload.activityLevel && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actividad</p>
                <p className="text-sm font-semibold text-slate-700 mt-1 capitalize">
                  {payload.activityLevel.replace('_', ' ')}
                </p>
              </div>
            )}
            {payload.nutritionalFocus && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Foco</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{payload.nutritionalFocus}</p>
              </div>
            )}
            {payload.fitnessGoals && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{payload.fitnessGoals}</p>
              </div>
            )}
          </div>

          {payload.dietRestrictions && payload.dietRestrictions.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                <Heart className="h-3 w-3 inline mr-1 text-rose-400" />
                Restricciones
              </p>
              <div className="flex flex-wrap gap-2">
                {payload.dietRestrictions.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"
                  >
                    <Heart className="h-3 w-3" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {payload.likes && (
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                Preferencias
              </p>
              <p className="text-sm text-slate-600">{payload.likes}</p>
            </div>
          )}

          {submission.status === 'REJECTED' && submission.rejectReason && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider mb-1">
                Motivo de rechazo
              </p>
              <p className="text-sm text-rose-700">{submission.rejectReason}</p>
            </div>
          )}

          {submission.status === 'PENDING' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
              <Button
                onClick={() => onApprove(submission.id)}
                disabled={isReviewing}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
              >
                {isReviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprobar y crear paciente
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject(submission.id)}
                disabled={isReviewing}
                className="flex-1 h-11 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-medium gap-2"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PendingSubmissionsClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | Status>('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: stats } = useIntakeSubmissionStats();
  const {
    data: submissionsData,
    reviewSubmission,
    isReviewing,
  } = useIntakeSubmissions({ status: statusFilter, page });

  const handleApprove = async (id: string) => {
    try {
      await reviewSubmission({ id, action: 'APPROVED' });
      toast.success('Paciente creado. La solicitud fue aprobada.');
    } catch {
      toast.error('Error al aprobar la solicitud');
    }
  };

  const handleRejectRequest = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      await reviewSubmission({
        id: rejectingId,
        action: 'REJECTED',
        rejectReason,
      });
      toast.success('Solicitud rechazada');
    } catch {
      toast.error('Error al rechazar la solicitud');
    } finally {
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const submissions: PatientIntakeSubmission[] = submissionsData?.data ?? [];
  const meta = submissionsData?.meta ?? { total: 0, pendingCount: 0, page: 1, lastPage: 1 };

  return (
    <ModuleLayout
      title="Solicitudes Pendientes"
      description="Formularios enviados por pacientes potenciales que esperan tu aprobación."
      className="pb-8"
    >
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'TODOS'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={cn(
                  'px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer',
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {s === 'PENDING'
                  ? `Pendientes (${stats?.pending ?? 0})`
                  : s === 'TODOS'
                    ? `Todos (${meta.total})`
                    : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/pacientes')}
            className="h-10 gap-2 rounded-xl text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a pacientes
          </Button>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <AlertTriangle className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="mb-2 font-semibold text-slate-600">Sin solicitudes</h3>
            <p className="text-sm text-slate-400">
              {statusFilter === 'PENDING'
                ? 'No hay solicitudes pendientes. Cuando un paciente complete el formulario, aparecerá aquí.'
                : `No hay solicitudes ${STATUS_LABELS[statusFilter as Status]?.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={handleApprove}
                onReject={handleRejectRequest}
                isReviewing={isReviewing}
              />
            ))}
          </div>
        )}

        {meta.lastPage > 1 && (
          <Pagination
            currentPage={page}
            totalPages={meta.lastPage}
            onPageChange={setPage}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onConfirm={handleConfirmReject}
        title="¿Rechazar esta solicitud?"
        description={
          rejectingId
            ? 'El formulario será marcado como rechazado. El paciente no será creado.'
            : ''
        }
        confirmText="Rechazar"
        variant="destructive"
      />
    </ModuleLayout>
  );
}
