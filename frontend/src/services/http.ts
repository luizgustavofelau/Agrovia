export const API_ORIGIN = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
export function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('accessToken');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_ORIGIN}${path}`, { ...options, headers });
}
