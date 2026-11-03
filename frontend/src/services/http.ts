import { handleExpiredSession } from './session';

export const API_ORIGIN = (process.env.REACT_APP_API_URL || '').trim().replace(/\/+$/, '');
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('accessToken');
  const isLogin = path === '/api/login';
  if (isLogin) headers.delete('Authorization');
  else if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_ORIGIN}${path}`, { ...options, headers });
  if (response.status === 401 && !isLogin) handleExpiredSession();
  return response;
}
