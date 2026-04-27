import PortalClient from "./PortalClient";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PortalPage(props: PageProps) {
  const { token } = await props.params;

  return <PortalClient token={token} />;
}
