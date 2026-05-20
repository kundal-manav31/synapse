const BASE = 'https://api.lemonsqueezy.com/v1';

export function isLSConfigured(): boolean {
  return !!(process.env.LS_API_KEY && process.env.LS_STORE_ID);
}

export async function lsRequest(path: string, options: RequestInit = {}) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.LS_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      ...(options.headers ?? {}),
    },
  });
}
