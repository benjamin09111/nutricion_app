import BookingLinkClient from "./BookingLinkClient";

interface PageProps {
  params: Promise<{
    nutriId: string;
    token: string;
  }>;
}

export default async function BookingLinkPage(props: PageProps) {
  const { nutriId, token } = await props.params;

  return <BookingLinkClient nutriId={nutriId} token={token} />;
}
