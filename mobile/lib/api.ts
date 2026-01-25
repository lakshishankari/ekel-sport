import { API_BASE_URL } from "./config";

export type UserRole = "STUDENT" | "ADMIN" | "ADVISORY";

export type ApiUser = {
  id: number;
  role: UserRole;
  studentId?: string | null;
  fullName: string;
  email: string;
};

/**
 * IMPORTANT:
 * Your backend routes are mounted like:
 *   app.use("/api/auth", authRoutes);
 * So from mobile you should call:
 *   apiPost("/api/auth/login", ...)
 *   apiPost("/api/auth/register", ...)
 */
function buildUrl(path: string) {
  // Ensures you don't accidentally pass "auth/login" and get a broken URL
  if (!path.startsWith("/")) path = "/" + path;
  return `${API_BASE_URL}${path}`;
}

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data: any = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as T;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data: any = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as T;
}
