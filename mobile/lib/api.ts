import { API_BASE_URL } from "./config";
import { loadAuth } from "./authStore";

export type UserRole = "STUDENT" | "ADMIN" | "ADVISORY";

export type ApiUser = {
  id: number;
  role: UserRole;
  studentId?: string | null;
  fullName: string;
  email: string;
};

function buildUrl(path: string) {
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

async function getToken(passedToken?: string) {
  if (passedToken) return passedToken;
  const { token } = await loadAuth();
  return token || undefined;
}

// ✅ IMPORTANT: normalize token to avoid "Bearer Bearer xxx" or quotes
function normalizeToken(t?: string) {
  if (!t) return undefined;

  let token = String(t).trim();

  // Remove surrounding quotes if accidentally saved like "xxxx"
  token = token.replace(/^"+|"+$/g, "");

  // Remove "Bearer " if it already exists
  token = token.replace(/^Bearer\s+/i, "");

  token = token.trim();
  return token.length > 0 ? token : undefined;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const finalToken = normalizeToken(await getToken(token));
  const url = buildUrl(path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data: any = await parseResponse(res);

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out. Check that the server is running at ${url}`);
    }
    if (err.message && !err.message.includes("Request failed") && !err.message.includes("timed out")) {
      throw new Error(`Network error — could not reach server at ${url}. Make sure your phone is on the same WiFi as the PC.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const finalToken = normalizeToken(await getToken(token));
  const url = buildUrl(path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
      },
    });

    const data: any = await parseResponse(res);

    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out. Check that the server is running at ${url}`);
    }
    if (err.message && !err.message.includes("Request failed") && !err.message.includes("timed out")) {
      throw new Error(`Network error — could not reach server at ${url}. Make sure your phone is on the same WiFi as the PC.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
