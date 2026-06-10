import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { type PatientPortalFollowUpsResponse } from "./types";

export type FollowUpsTab = "Todos" | "Pendientes";

export type UseFollowUpsParams = {
  page: number;
  searchTerm: string;
  tab: FollowUpsTab;
  documentIdFilter: string;
  classificationTags: string[];
  pendingOnly: boolean;
};

const buildFollowUpsQuery = ({
  page,
  searchTerm,
  tab,
  documentIdFilter,
  classificationTags,
  pendingOnly,
}: UseFollowUpsParams) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    ...(searchTerm && { search: searchTerm }),
    ...(tab === "Pendientes" && { pendingOnly: "true" }),
    ...(documentIdFilter && { documentId: documentIdFilter }),
    ...(classificationTags.length > 0 && {
      tags: classificationTags.join(","),
    }),
    ...(pendingOnly && { pendingOnly: "true" }),
  });

  return queryParams.toString();
};

async function fetchFollowUps(
  params: UseFollowUpsParams,
): Promise<PatientPortalFollowUpsResponse> {
  const token = getAuthToken();
  const response = await fetchApi(
    `/patient-portals/follow-ups?${buildFollowUpsQuery(params)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar el seguimiento de pacientes");
  }

  return response.json();
}

export function useFollowUps(params: UseFollowUpsParams) {
  const query = useQuery({
    queryKey: ["patient-follow-ups", params],
    queryFn: () => fetchFollowUps(params),
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    followUps: query.data?.data ?? [],
    meta: query.data?.meta ?? {
      total: 0,
      filteredTotal: 0,
      pendingCount: 0,
      page: params.page,
      lastPage: 1,
    },
  };
}
