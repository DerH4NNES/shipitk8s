// src/lib/apiClient.ts
export async function apiFetch(req: Request, input: string, init: RequestInit = {}) {
    // Session‑Cookie weiterreichen
    const cookie = req.headers.get('cookie');
    const headers = new Headers(init.headers);
    if (cookie) headers.set('cookie', cookie);

    return fetch(input, {
        ...init,
        headers,
    });
}
