import { fetchAppointmentsApi, parseAppointmentsError } from "@/lib/appointments";

export type CreateAppointmentInput = {
  calendarId: string;
  payload: Record<string, unknown>;
};

export async function createAppointment(input: CreateAppointmentInput) {
  const response = await fetchAppointmentsApi(`/calendars/${input.calendarId}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input.payload),
  });

  const fallbackResponse =
    response.status === 404
      ? await fetchAppointmentsApi("/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ calendarId: input.calendarId, ...input.payload }),
        })
      : response;

  if (!fallbackResponse.ok) {
    const payload = await fallbackResponse.json().catch(() => ({}));
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : "No se pudo crear la cita.";
    throw new Error(message);
  }
}

export async function approveAppointment(appointmentId: string) {
  const response = await fetchAppointmentsApi(`/appointments/${appointmentId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(parseAppointmentsError(response, `/appointments/${appointmentId}/approve`).message);
  }
}

export async function rejectAppointment(appointmentId: string) {
  const response = await fetchAppointmentsApi(`/appointments/${appointmentId}/reject`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(parseAppointmentsError(response, `/appointments/${appointmentId}/reject`).message);
  }
}
