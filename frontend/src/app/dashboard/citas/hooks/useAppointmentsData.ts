import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointmentsJson,
  AppointmentCalendar,
  AppointmentEvent,
  AppointmentSlot,
  AppointmentRequest,
} from "@/lib/appointments";
import {
  normalizeCalendar,
  parseWeekRulesPayload,
  normalizeEvents,
  normalizeSlots,
  normalizeRequests,
  WeekRule,
  formatDateKey,
} from "../utils";

export const useCalendarMe = () => {
  return useQuery({
    queryKey: ["appointments", "calendars", "me"],
    queryFn: async () => {
      try {
        const data = await fetchAppointmentsJson("/calendars/me");
        const calendar = normalizeCalendar(data);
        if (!calendar?.id) throw new Error("No calendar ID found");
        return calendar;
      } catch (error) {
        console.error("Failed to fetch calendar/me:", error);
        return null;
      }
    },
  });
};

export const useAvailabilityRules = (calendarId?: string) => {
  return useQuery({
    queryKey: ["appointments", "calendars", calendarId, "rules"],
    queryFn: async () => {
      if (!calendarId) return [];
      try {
        const data = await fetchAppointmentsJson(`/calendars/${calendarId}/availability/rules`);
        return parseWeekRulesPayload(data);
      } catch (error) {
        console.error("Failed to fetch availability rules:", error);
        return [];
      }
    },
    enabled: !!calendarId,
  });
};

export const useWeekView = (calendarId?: string, anchorDate?: Date) => {
  const weekStartStr = anchorDate ? formatDateKey(anchorDate) : undefined;
  
  return useQuery({
    queryKey: ["appointments", "calendars", calendarId, "weekView", weekStartStr],
    queryFn: async () => {
      if (!calendarId || !weekStartStr) return { events: [], slots: [] };
      try {
        let events: AppointmentEvent[] = [];
        let slots: AppointmentSlot[] = [];
        
        try {
          const weekData = await fetchAppointmentsJson(`/calendars/${calendarId}/view/week?weekStart=${weekStartStr}`);
          events = normalizeEvents(weekData);
        } catch (e) {
          console.warn("Failed /view/week, falling back to /appointments", e);
          const from = weekStartStr;
          const toDate = new Date(weekStartStr);
          toDate.setDate(toDate.getDate() + 7);
          const to = formatDateKey(toDate);
          const eventsData = await fetchAppointmentsJson(`/appointments?from=${from}&to=${to}`);
          events = normalizeEvents(eventsData);
        }

        try {
          const from = weekStartStr;
          const toDate = new Date(weekStartStr);
          toDate.setDate(toDate.getDate() + 7);
          const to = formatDateKey(toDate);
          
          let slotsData;
          try {
            slotsData = await fetchAppointmentsJson(
              `/availability/free-slots?calendarId=${calendarId}&from=${from}&to=${to}&durationMin=30`
            );
          } catch (e1) {
            console.warn("Failed /availability/free-slots, trying /calendars/.../availability/free-slots", e1);
            try {
              slotsData = await fetchAppointmentsJson(
                `/calendars/${calendarId}/availability/free-slots?from=${from}&to=${to}&durationMin=30`
              );
            } catch (e2) {
              console.warn("Failed second fallback, trying /slots", e2);
              slotsData = await fetchAppointmentsJson(
                `/calendars/${calendarId}/slots?from=${from}&to=${to}&durationMin=30`
              );
            }
          }
          
          slots = normalizeSlots(slotsData);
        } catch (slotErr) {
          console.error("Failed fetching slots entirely:", slotErr);
          slots = [];
        }
        
        return { events, slots };
      } catch (error) {
        console.error("Failed to fetch week view:", error);
        return { events: [], slots: [] };
      }
    },
    enabled: !!calendarId && !!weekStartStr,
  });
};

export const useCalendarRequests = (calendarId?: string) => {
  return useQuery({
    queryKey: ["appointments", "calendars", calendarId, "requests"],
    queryFn: async () => {
      if (!calendarId) return [];
      try {
        let requests: AppointmentRequest[] = [];
        try {
          const reqsData = await fetchAppointmentsJson(`/calendars/${calendarId}/requests?status=REQUESTED`);
          requests = normalizeRequests(reqsData);
        } catch (e) {
          console.warn("Failed /requests, falling back to /appointments filter", e);
          const appointmentsData = await fetchAppointmentsJson(`/appointments`);
          const allReqs = normalizeRequests(appointmentsData);
          requests = allReqs.filter(r => r.status === "REQUESTED" || r.status === "pending" || r.status === "PENDING");
        }
        return requests;
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        return [];
      }
    },
    enabled: !!calendarId,
    refetchInterval: 30000, // Refresh every 30s
  });
};
