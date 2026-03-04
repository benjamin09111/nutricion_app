import PatientDetailClient from "./PatientDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PatientDetailPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PatientDetailClient id={id} />
    </div>
  );
}
