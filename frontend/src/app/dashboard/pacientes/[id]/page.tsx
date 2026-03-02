import { use } from "react";
import PatientDetailClient from "./PatientDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PatientDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PatientDetailClient id={resolvedParams.id} />
    </div>
  );
}
