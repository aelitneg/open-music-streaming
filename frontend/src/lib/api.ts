async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export type SessionResponse =
  | { authenticated: true; did: string }
  | { authenticated: false };

export function getSession(): Promise<SessionResponse> {
  return request('/auth/session');
}

export function login(handle: string): Promise<{ url: string }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export function logout(): Promise<{ success: boolean }> {
  return request('/auth/logout', { method: 'POST' });
}
