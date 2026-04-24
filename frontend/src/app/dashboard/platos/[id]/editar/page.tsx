
import EditarPlatoClient from "./EditarPlatoClient";

export default function EditarPlatoPage({ params }: { params: { id: string } }) {
  return <EditarPlatoClient id={params.id} />;
}
