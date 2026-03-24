import DashboardHomeClient from "./DashboardHomeClient";

export const metadata = {
  title: "Principal | NutriSaaS",
  description:
    "Centro de trabajo para crear, retomar y avanzar proyectos clínicos.",
};

export default function DashboardPage() {
  return <DashboardHomeClient />;
}
