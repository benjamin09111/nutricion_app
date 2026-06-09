import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams?.token;

  return <VerifyEmailClient token={token || null} />;
}
