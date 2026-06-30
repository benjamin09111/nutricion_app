"use client";

import { useEffect, useState } from 'react';
import {
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link2,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';
import { useIntakeLink } from '@/features/patients-intake/hooks/usePatientIntake';
import { cn } from '@/lib/utils';

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LinkResponse {
  id: string;
  tokenHash: string;
  token?: string;
  tokenVersion?: number;
  status: 'ACTIVE' | 'DISABLED';
  [key: string]: unknown;
}

export function ShareFormModal({ isOpen, onClose }: ShareFormModalProps) {
  const router = useRouter();
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const {
    data: linkData,
    isLoading,
    createLink,
    regenerateLink,
    setStatus,
    isCreating,
    isRegenerating,
    isSettingStatus,
  } = useIntakeLink();

  const hasLink = linkData?.hasLink;
  const status = linkData?.status;
  const tokenFromServer = linkData?.token;
  const frontendBase =
    typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (tokenFromServer) {
      setCurrentToken(tokenFromServer);
    }
  }, [tokenFromServer]);

  const getShareUrl = () => {
    if (tokenFromServer) {
      return `${frontendBase}/formulario-paciente/${tokenFromServer}`;
    }

    if (currentToken) return `${frontendBase}/formulario-paciente/${currentToken}`;
    return null;
  };

  const handleCopyLink = async () => {
    if (!hasLink) {
      try {
        const response = await createLink();
        const link = response as LinkResponse;
        setCurrentToken(link.token ?? link.id);
        const fullUrl = `${frontendBase}/formulario-paciente/${link.token ?? link.id}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Link copiado al portapapeles');
      } catch {
        toast.error('Error al crear el link');
      }
      return;
    }

    const token = tokenFromServer || currentToken;
    if (!token) {
      toast.error('No se pudo recuperar el token del formulario');
      return;
    }

    const fullUrl = `${frontendBase}/formulario-paciente/${token}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('Link copiado al portapapeles');
  };

  const handleRegenerate = async () => {
    try {
      const response = await regenerateLink();
      const link = response as LinkResponse;
      setCurrentToken(link.token ?? link.id);
      toast.success('Link regenerado. El link anterior ya no es válido.');
    } catch {
      toast.error('Error al regenerar el link');
    } finally {
      setShowRegenerateConfirm(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!status) return;
    const newStatus = status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setStatus(newStatus);
      toast.success(
        newStatus === 'ACTIVE'
          ? 'Formulario activado'
          : 'Formulario desactivado',
      );
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleViewPending = () => {
    onClose();
    router.push('/dashboard/pacientes/pendientes');
  };

  const shareUrl = getShareUrl();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-500">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
              <Link2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Compartir Formulario
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Genera un link para que tus pacientes se registren solos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Estado del formulario
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
                )}
              >
                {status === 'ACTIVE' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Link para compartir
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 truncate rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-600">
                    {shareUrl ? (
                      <span className="text-slate-700">{shareUrl}</span>
                    ) : (
                      <span className="text-slate-400">
                        Genera un link para ver el enlace aquí
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    disabled={isCreating || isRegenerating || isSettingStatus}
                    className="shrink-0 h-10 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-xs font-bold">
                      {!hasLink ? 'Generar' : 'Copiar'}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-amber-50/50 p-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                <p className="text-xs text-amber-700">
                  Solo la persona que tenga este link puede enviar el formulario.
                  Si lo compartes públicamente, cualquiera podrá usarlo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {hasLink && status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={handleViewPending}
                className="h-11 justify-center gap-2 rounded-xl border-indigo-100 text-indigo-700 hover:bg-indigo-50 font-medium"
              >
                <Clock className="h-4 w-4" />
                Ver solicitudes pendientes
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={!hasLink || isRegenerating || isSettingStatus}
              className="h-11 justify-center gap-2 rounded-xl border-slate-200 text-sm font-medium"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRegenerating && 'animate-spin')}
              />
              Regenerar link
            </Button>

            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={!hasLink || isSettingStatus || isRegenerating}
              className={cn(
                'h-11 justify-center gap-2 rounded-xl text-sm font-medium',
                status === 'ACTIVE'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50',
              )}
            >
              {status === 'ACTIVE' ? (
                <>
                  <XCircle className="h-4 w-4" />
                  Desactivar formulario
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Activar formulario
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 p-6">
          <Button
            onClick={onClose}
            variant="ghost"
            className="rounded-2xl px-6"
          >
            Cerrar
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title="¿Regenerar el link?"
        description="El link anterior dejará de funcionar. Solo el nuevo link servirá para enviar formularios. Asegúrate de compartir el nuevo link con tus pacientes."
        confirmText="Regenerar"
        variant="primary"
      />
    </div>
  );
}
