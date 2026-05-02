import AppointmentsClient from "./AppointmentsClient";

export const metadata = {
  title: "Citas | NutriSaaS",
  description: "Calendario, próximas citas y peticiones de cita.",
};

export default function AppointmentsPage() {
  return <AppointmentsClient />;
}
