const API_BASE = import.meta.env.VITE_API_URL || '';

interface User {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  user: User
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  register(name: string, email: string, password: string) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },
  logout() {
    return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
  },
  me() {
    return request<AuthResponse>('/api/auth/me');
  }
};
