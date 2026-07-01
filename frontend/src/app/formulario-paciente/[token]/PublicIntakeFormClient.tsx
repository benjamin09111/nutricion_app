"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Scale,
  Ruler,
  Activity,
  Heart,
  Target,
  Send,
  Loader2,
  CheckCircle2,
  Flame,
  Dumbbell,
  HeartPulse,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { intakeFormSchema } from '@/lib/schemas/intake-form.schema';
import {
  validatePublicIntakeToken,
  submitPublicIntakeForm,
} from '@/lib/public-intake-api';
import { cn } from '@/lib/utils';

const ACTIVITY_OPTIONS = [
  { value: 'sedentario', label: 'Sedentario', icon: Flame },
  { value: 'ligero', label: 'Ligero', icon: Activity },
  { value: 'moderado', label: 'Moderado', icon: HeartPulse },
  { value: 'activo', label: 'Activo', icon: Dumbbell },
  { value: 'muy_activo', label: 'Muy activo', icon: Dumbbell },
];

const NUTRITIONAL_FOCUS_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Mantener peso', label: 'Mantener peso' },
  { value: 'Bajar de peso', label: 'Bajar de peso' },
  { value: 'Subir de peso', label: 'Subir de peso' },
  { value: 'Mejorar composición corporal', label: 'Mejorar composición corporal' },
  { value: 'Control metabólico', label: 'Control metabólico' },
  { value: 'Alimentación saludable general', label: 'Alimentación saludable general' },
  { value: 'Rendimiento deportivo', label: 'Rendimiento deportivo' },
];

const FITNESS_GOALS_OPTIONS = [
  { value: '', label: 'No aplica' },
  { value: 'Salud general', label: 'Salud general' },
  { value: 'Pérdida de grasa', label: 'Pérdida de grasa' },
  { value: 'Ganancia muscular', label: 'Ganancia muscular' },
  { value: 'Resistencia', label: 'Resistencia' },
  { value: 'Fuerza', label: 'Fuerza' },
  { value: 'Rendimiento deportivo', label: 'Rendimiento deportivo' },
];

type ValidationState = 'loading' | 'valid' | 'invalid' | 'disabled';
type IntakeFormValues = z.input<typeof intakeFormSchema>;
type IntakeFormOutput = z.output<typeof intakeFormSchema>;

export default function PublicIntakeFormClient() {
  const params = useParams();
  const token = params.token as string;

  const [validationState, setValidationState] = useState<ValidationState>('loading');
  const [validationMessage, setValidationMessage] = useState('');
  const [nutritionistName, setNutritionistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IntakeFormValues, undefined, IntakeFormOutput>({
    resolver: zodResolver(intakeFormSchema) as any,
    defaultValues: {
      fullName: '',
      dietRestrictions: '',
      gender: undefined,
      activityLevel: undefined,
      nutritionalFocus: '',
      fitnessGoals: '',
      email: '',
      phone: '',
      documentId: '',
      birthDate: '',
      likes: '',
    },
  });

  const selectedActivity = watch('activityLevel');

  useEffect(() => {
    if (!token || token.length < 10) {
      setValidationState('invalid');
      setValidationMessage('Token inválido');
      return;
    }

    validatePublicIntakeToken(token)
      .then((data) => {
        if (data.valid) {
          setValidationState('valid');
          setNutritionistName(data.nutritionistName || '');
        } else {
          setValidationState(data.reason === 'DISABLED' ? 'disabled' : 'invalid');
          setValidationMessage(
            data.message || 'Este formulario no está disponible',
          );
        }
      })
      .catch(() => {
        setValidationState('invalid');
        setValidationMessage('No se pudo validar el formulario');
      });
  }, [token]);

  const onSubmit = async (data: IntakeFormOutput) => {
    setIsSubmitting(true);
    try {
      const cleanData = {
        fullName: data.fullName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        documentId: data.documentId || undefined,
        birthDate: data.birthDate || undefined,
        gender: data.gender,
        height: data.height || undefined,
        weight: data.weight || undefined,
        activityLevel: data.activityLevel,
        nutritionalFocus: data.nutritionalFocus || undefined,
        fitnessGoals: data.fitnessGoals || undefined,
        dietRestrictions: data.dietRestrictions || [],
        likes: data.likes || undefined,
      };

      const response = await submitPublicIntakeForm(token, cleanData);

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al enviar el formulario');
      }
    } catch {
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validationState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-500">Validando formulario...</p>
        </div>
      </div>
    );
  }

  if (validationState === 'invalid' || validationState === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <XCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Formulario no disponible
          </h1>
          <p className="text-slate-500">{validationMessage}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            ¡Formulario enviado!
          </h1>
          <p className="text-slate-500 mb-4">
            Tu información fue recibida. Tu nutricionista{' '}
            {nutritionistName ? `(${nutritionistName})` : ''} la revisará pronto y se
            pondrá en contacto contigo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-20">
        <div className="bg-slate-900 rounded-2xl p-5 mb-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Formulario de Paciente
              </h1>
              {nutritionistName && (
                <p className="text-indigo-200/60 text-sm">
                  Nutricionista: {nutritionistName}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Datos personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Nombre completo *
                </label>
                <Input
                  {...register('fullName')}
                  placeholder="Valentina Morales Lagos"
                  className={cn(
                    'h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold',
                    errors.fullName && 'border-rose-300 bg-rose-50/50',
                  )}
                />
                {errors.fullName && (
                  <p className="text-[10px] font-medium text-rose-500 ml-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="valen@email.com"
                    className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    {...register('phone')}
                    placeholder="+56 9 1234 5678"
                    className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  RUT / Documento
                </label>
                <Input
                  {...register('documentId')}
                  placeholder="12.345.678-9"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Fecha de nacimiento
                </label>
                <Input
                  {...register('birthDate')}
                  type="date"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Sexo biológico
                </label>
                <select
                  {...register('gender')}
                  className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-600" />
              Medidas corporales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Peso (kg)
                </label>
                <Input
                  {...register('weight')}
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 70.5"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base"
                />
                {errors.weight && (
                  <p className="text-[10px] font-medium text-rose-500 ml-1">
                    {errors.weight.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Altura (cm)
                </label>
                <Input
                  {...register('height')}
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 170"
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-center font-bold text-base"
                />
                {errors.height && (
                  <p className="text-[10px] font-medium text-rose-500 ml-1">
                    {errors.height.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Actividad física
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('activityLevel', opt.value as any)}
                  className={cn(
                    'h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer',
                    selectedActivity === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100',
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Objetivos y restricciones
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                    Foco nutricional
                  </label>
                  <select
                    {...register('nutritionalFocus')}
                    className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    {NUTRITIONAL_FOCUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                    Meta fitness
                  </label>
                  <select
                    {...register('fitnessGoals')}
                    className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    {FITNESS_GOALS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Restricciones / Alergias / Condiciones
                </label>
                <Input
                  {...register('dietRestrictions')}
                  placeholder="Ej: Diabetes, Celiaco, Alergia a maní..."
                  className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold"
                />
                <p className="text-[10px] text-slate-400 ml-1">
                  Escribe las restricciones separadas por coma
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Preferencias
            </h2>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  ¿Qué te gusta comer?
                </label>
              <textarea
                {...register('likes')}
                rows={3}
                placeholder="Ej: Prefiero comidas calientes, me gusta el pollo, no tolero el pescado..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm font-medium text-slate-700 resize-none focus:border-indigo-500/20 focus:ring-2 focus:ring-indigo-500/5 transition-all"
              />
            </div>
          </div>

          <input
            type="text"
            {...register('honeypot')}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base gap-3 shadow-xl shadow-emerald-200/50 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
          </Button>
        </form>
      </div>
    </div>
  );
}
