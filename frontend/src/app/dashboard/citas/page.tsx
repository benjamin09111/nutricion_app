import { redirect } from "next/navigation";

export const metadata = {
  title: "Citas | NutriNet",
  description: "Calendario, próximas citas y peticiones de cita.",
};

export default function AppointmentsPage() {
  redirect("/dashboard");
}
