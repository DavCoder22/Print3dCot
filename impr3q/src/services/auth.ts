import { reactive } from 'vue'
import { api } from './api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string
}

export const auth = reactive<AuthState>({
  user: null,
  loading: true,
  error: ''
});

export async function checkAuth() {
  auth.loading = true;
  try {
    const res = await api.me();
    auth.user = res.user;
  } catch {
    auth.user = null;
  } finally {
    auth.loading = false;
  }
}

export async function login(email: string, password: string) {
  auth.error = '';
  try {
    const res = await api.login(email, password);
    auth.user = res.user;
    return true;
  } catch (err: any) {
    auth.error = err.message;
    return false;
  }
}

export async function register(name: string, email: string, password: string) {
  auth.error = '';
  try {
    const res = await api.register(name, email, password);
    auth.user = res.user;
    return true;
  } catch (err: any) {
    auth.error = err.message;
    return false;
  }
}

export async function logout() {
  try {
    await api.logout();
  } catch { }
  auth.user = null;
}
