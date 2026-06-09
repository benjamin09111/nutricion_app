import WelcomeMembershipClient from "./WelcomeMembershipClient";

export const dynamic = "force-dynamic";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: Promise<{
    plan?: string | string[];
    slug?: string | string[];
    payment?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const plan = Array.isArray(resolvedSearchParams?.plan)
    ? resolvedSearchParams?.plan[0]
    : resolvedSearchParams?.plan;
  const slug = Array.isArray(resolvedSearchParams?.slug)
    ? resolvedSearchParams?.slug[0]
    : resolvedSearchParams?.slug;
  const payment = Array.isArray(resolvedSearchParams?.payment)
    ? resolvedSearchParams?.payment[0]
    : resolvedSearchParams?.payment;

  return (
    <WelcomeMembershipClient
      initialPlan={plan || null}
      planSlug={slug || null}
      payment={payment || null}
    />
  );
}
