import { ApiError } from "@/lib/api-client"

/**
 * Normalize API / unknown errors into a user-facing string.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof ApiError) {
    return error.message || fallback
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === "string" && error.trim()) {
    return error
  }
  return fallback
}
