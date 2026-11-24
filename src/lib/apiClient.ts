/** Thin typed helpers around the JSON API contract ({ ok, data | error }). */

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function parse<T>(res: Response): Promise<T> {
  let body: { ok?: boolean; data?: T; error?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("server_error", res.status);
  }
  if (!body || body.ok !== true) {
    throw new ApiError(body?.error ?? "server_error", res.status);
  }
  return body.data as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  return parse<T>(res);
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH",
  payload?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return parse<T>(res);
}
