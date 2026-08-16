"use client"

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/errors"

export type AppMutationOptions<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
> = {
  /** Async API call — errors normalized via getApiErrorMessage */
  mutationFn: (variables: TVariables) => Promise<TData>
  showErrorToast?: boolean
  errorFallback?: string
  showSuccessToast?:
    | boolean
    | string
    | ((data: TData, variables: TVariables) => string | undefined)
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void
  onError?: (
    error: Error,
    variables: TVariables,
    context: TContext | undefined,
  ) => void
} & Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  "mutationFn" | "onSuccess" | "onError"
>

export type AppMutationResult<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
> = UseMutationResult<TData, Error, TVariables, TContext>

/**
 * Reusable TanStack Query mutation for API writes.
 */
export function useAppMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: AppMutationOptions<TData, TVariables, TContext>,
): AppMutationResult<TData, TVariables, TContext> {
  const {
    mutationFn,
    showErrorToast = true,
    errorFallback = "حدث خطأ ما",
    showSuccessToast = false,
    onSuccess,
    onError,
    ...rest
  } = options

  const wrappedFn = useCallback(
    async (variables: TVariables) => {
      try {
        const data = await mutationFn(variables)

        if (showSuccessToast) {
          const message =
            typeof showSuccessToast === "function"
              ? showSuccessToast(data, variables)
              : typeof showSuccessToast === "string"
                ? showSuccessToast
                : undefined
          if (message) toast.success(message)
        }

        onSuccess?.(data, variables, undefined)
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        if (showErrorToast) {
          toast.error(getApiErrorMessage(err, errorFallback))
        }
        onError?.(err, variables, undefined)
        throw err
      }
    },
    [
      mutationFn,
      showErrorToast,
      errorFallback,
      showSuccessToast,
      onSuccess,
      onError,
    ],
  )

  return useMutation({
    mutationFn: wrappedFn,
    ...rest,
  })
}
