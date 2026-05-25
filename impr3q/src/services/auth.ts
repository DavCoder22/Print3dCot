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
  demoMode: boolean
}

export const auth = reactive<AuthState>({
  user: null,
  loading: true,
  error: '',
  demoMode: false
});

const DEMO_USERS_KEY = 'impr3q_demo_users';
const DEMO_SESSION_KEY = 'impr3q_demo_session';

function getDemoUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
  } catch { return []; }
}

function saveDemoUsers(users: User[]) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function getDemoSession(): User | null {
  try {
    return JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || 'null');
  } catch { return null; }
}

function setDemoSession(user: User) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export async function checkAuth() {
  auth.loading = true;
  auth.error = '';
  try {
    await api.health();
    const res = await api.me();
    auth.user = res.user;
    auth.demoMode = false;
  } catch {
    auth.demoMode = true;
    auth.user = getDemoSession();
  } finally {
    auth.loading = false;
  }
}

export async function login(email: string, password: string) {
  auth.error = '';
  if (!auth.demoMode) {
    try {
      const res = await api.login(email, password);
      auth.user = res.user;
      return true;
    } catch (err: any) {
      auth.error = err.message;
      return false;
    }
  }
  const users = getDemoUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    auth.error = 'Credenciales inválidas';
    return false;
  }
  auth.user = user;
  setDemoSession(user);
  return true;
}

export async function register(name: string, email: string, password: string) {
  auth.error = '';
  if (!auth.demoMode) {
    try {
      const res = await api.register(name, email, password);
      auth.user = res.user;
      return true;
    } catch (err: any) {
      auth.error = err.message;
      return false;
    }
  }
  const users = getDemoUsers();
  if (users.find(u => u.email === email)) {
    auth.error = 'El correo ya está registrado';
    return false;
  }
  const newUser: User = { id: Date.now().toString(), name, email };
  users.push(newUser);
  saveDemoUsers(users);
  auth.user = newUser;
  setDemoSession(newUser);
  return true;
}

export async function logout() {
  if (!auth.demoMode) {
    try { await api.logout(); } catch { }
  }
  clearDemoSession();
  auth.user = null;
}
