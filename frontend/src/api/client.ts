import type { FieldError } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const { field, message } of this.details) {
      result[field] ??= message;
    }
    return result;
  }
}

const TOKEN_KEY = "doc-approval.token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable (e.g. private mode)
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage unavailable
    }
  },
};

let handleUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  handleUnauthorized = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  json?: unknown;
  formData?: FormData;
}

async function send(path: string, options: RequestOptions = {}): Promise<Response> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData; // the browser adds the multipart boundary
  } else if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(new URL(`/api${path}`, window.location.origin), {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
  }

  if (response.ok) return response;

  if (response.status === 401 && token) {
    handleUnauthorized?.();
  }
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: FieldError[] };
  } | null;
  throw new ApiError(
    response.status,
    payload?.error?.code ?? "UNKNOWN_ERROR",
    payload?.error?.message ?? "Something went wrong. Please try again.",
    payload?.error?.details,
  );
}

export async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await send(path, options);
  return (await response.json()) as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await send(path);
  return response.blob();
}
