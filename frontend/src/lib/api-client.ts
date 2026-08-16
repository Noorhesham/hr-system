const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3004/api"

/** In-memory access token — never persisted to localStorage. */
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Skip Authorization header (e.g. login/register). */
  skipAuth?: boolean
  /** Skip the single 401 → refresh → retry cycle. */
  skipRefresh?: boolean
}

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        setAccessToken(null)
        return null
      }
      const data = (await res.json()) as { accessToken: string }
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    body,
    skipAuth = false,
    skipRefresh = false,
    headers: initHeaders,
    ...rest
  } = options

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData

  const headers = new Headers(initHeaders)
  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  })

  if (
    res.status === 401 &&
    !skipRefresh &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  ) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiFetch<T>(path, { ...options, skipRefresh: true })
    }
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const err = data as {
      message?: string | string[]
      fieldErrors?: Record<string, string>
    } | null
    const message = Array.isArray(err?.message)
      ? err.message.join(", ")
      : typeof err?.message === "string"
        ? err.message
        : `Request failed (${res.status})`
    throw new ApiError(message, res.status, err?.fieldErrors)
  }

  return data as T
}

/** Multipart helper — posts `file` field to Cloudinary via POST /uploads. */
export async function uploadFile(
  file: File,
): Promise<{ url: string; publicId: string; resourceType: string }> {
  const form = new FormData()
  form.append("file", file)
  return apiFetch("/uploads", { method: "POST", body: form })
}

/**
 * Pre-auth onboarding logo upload (no JWT required).
 * Uses POST /uploads/onboarding-logo.
 */
export async function uploadOnboardingLogo(
  file: File,
): Promise<{ url: string; publicId: string; resourceType: string }> {
  const form = new FormData()
  form.append("file", file)
  return apiFetch("/uploads/onboarding-logo", {
    method: "POST",
    body: form,
    skipAuth: true,
    skipRefresh: true,
  })
}
