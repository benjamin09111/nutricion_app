import PatientDetailClient from "./PatientDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PatientDetailPage(props: PageProps) {
  const { id } = await props.params;

  return <PatientDetailClient id={id} />;
}
