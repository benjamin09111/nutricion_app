export function goToDashboard() {
  window.location.href = "/dashboard";
}

export function goToMembershipWelcome(params: {
  planName: string;
  planSlug?: string;
  payment?: string;
}) {
  const query = new URLSearchParams();
  query.set("plan", params.planName);
  if (params.planSlug) query.set("slug", params.planSlug);
  if (params.payment) query.set("payment", params.payment);

  window.location.href = `/dashboard/bienvenida?${query.toString()}`;
}
