const API_BASE = import.meta.env.VITE_API_URL || '';

interface User {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  token?: string
  user: User
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers as Record<string, string> };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('impr3q_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers,
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data as T;
}

export const api = {
  health() {
    return request<{ status: string }>('/api/health');
  },
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
