"use client";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

export type AppQueryOptions<TQueryFnData = unknown, TError = Error, TData = TQueryFnData> = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TQueryFnData>;
} & Omit<UseQueryOptions<TQueryFnData, TError, TData>, "queryKey" | "queryFn">;

/**
 * Reusable TanStack Query query hook for API reads.
 */
export function useAppQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: AppQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const { queryKey, queryFn, ...rest } = options;

  return useQuery({
    queryKey,
    queryFn,
    ...rest,
  });
}
