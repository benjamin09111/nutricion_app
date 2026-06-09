import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";

export const PUBLIC_PROFILE_UNAVAILABLE_MESSAGE =
  "Este perfil ya no es público";

export interface Nutritionist {
  id: string;
  slug: string;
  fullName: string;
  professionalId: string | null;
  specialty: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  consultationMode: string;
  location: string | null;
  avatarUrl: string | null;
  bookingEnabled: boolean;
  showSchedule: boolean;
  publicPhone: string | null;
  publicEmail: string | null;
  instagram: string | null;
  linkedin: string | null;
  isPublic?: boolean;
  conditionsTreated: string | null;
  patientTypes: string | null;
  prices: string | null;
  officeAddress: string | null;
  paymentMethods: string | null;
  acceptedInsurance: string | null;
  country: string | null;
}

export interface Availability {
  hasCalendar: boolean;
  calendarId?: string;
  timeZone?: string;
  schedule?: Record<string, Record<number, { available: boolean }>>;
}

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface FreeSlotResponse {
  slots: Slot[];
}

export function usePublicNutritionistProfile(slug: string, weekStart: Date) {
  const queryClient = useQueryClient();

  const nutritionistQuery = useQuery({
    queryKey: ["public-nutritionists", slug],
    queryFn: async (): Promise<Nutritionist> => {
      const response = await fetchApi(`/public/nutritionists/${slug}`);
      if (response.status === 410) {
        throw new Error(PUBLIC_PROFILE_UNAVAILABLE_MESSAGE);
      }
      if (!response.ok) {
        throw new Error("Nutricionista no encontrado");
      }
      return response.json();
    },
    enabled: Boolean(slug),
  });

  const availabilityQuery = useQuery({
    queryKey: ["public-nutritionists", slug, "availability"],
    queryFn: async (): Promise<Availability> => {
      const response = await fetchApi(
        `/public/nutritionists/${slug}/availability`,
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar la disponibilidad");
      }
      return response.json();
    },
    enabled: Boolean(slug) && Boolean(nutritionistQuery.data?.bookingEnabled),
  });

  const slotsQuery = useQuery({
    queryKey: [
      "public-nutritionists",
      slug,
      "slots",
      weekStart.toISOString(),
      availabilityQuery.data?.calendarId || null,
    ],
    queryFn: async (): Promise<FreeSlotResponse> => {
      const calendarId = availabilityQuery.data?.calendarId;
      if (!calendarId) return { slots: [] };

      const from = weekStart.toISOString();
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const to = nextWeek.toISOString();

      const response = await fetchApi(
        `/availability/free-slots?calendarId=${calendarId}&from=${from}&to=${to}&durationMin=60`,
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar los horarios");
      }

      return response.json();
    },
    enabled: Boolean(slug) && Boolean(availabilityQuery.data?.calendarId),
    placeholderData: keepPreviousData,
  });

  const requestAppointment = useMutation({
    mutationFn: async (payload: {
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      message?: string;
      startAt: string;
      endAt: string;
      slug: string;
    }) => {
      const response = await fetchApi(
        `/public/nutritionists/${payload.slug}/appointments/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: payload.guestName,
            guestEmail: payload.guestEmail,
            guestPhone: payload.guestPhone,
            message: payload.message,
            startAt: payload.startAt,
            endAt: payload.endAt,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 410) {
          throw new Error(PUBLIC_PROFILE_UNAVAILABLE_MESSAGE);
        }
        throw new Error(data.message || "Error al solicitar cita");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["public-nutritionists", slug],
      });
    },
  });

  return {
    nutritionistQuery,
    availabilityQuery,
    slotsQuery,
    requestAppointment,
  };
}
