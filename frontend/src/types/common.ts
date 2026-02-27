export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ID = string | number;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
