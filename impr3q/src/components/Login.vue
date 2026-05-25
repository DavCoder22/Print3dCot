<script setup lang="ts">
import { ref } from 'vue'
import { login, auth } from '../services/auth'

const emit = defineEmits<{
  (e: 'register'): void
  (e: 'loggedIn'): void
}>()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function handleLogin() {
  submitting.value = true
  const ok = await login(email.value, password.value)
  submitting.value = false
  if (ok) emit('loggedIn')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>IMPR<span class="highlight">3</span>Q</h1>
        <p>Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <input id="login-email" v-model="email" type="email" placeholder="tu@correo.com" required>
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input id="login-password" v-model="password" type="password" placeholder="••••••" required minlength="6">
        </div>

        <p v-if="auth.error" class="auth-error">{{ auth.error }}</p>

        <button type="submit" class="submit-button" :disabled="submitting">
          {{ submitting ? 'Entrando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="auth-switch">
        ¿No tienes cuenta?
        <button class="link-btn" @click="emit('register')">Regístrate</button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dc2626 0%, #000000 100%);
  padding: 20px;
}

.auth-card {
  background: #fff;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2rem;
  color: #000;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
}

.auth-header .highlight {
  color: #dc2626;
}

.auth-header p {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.auth-form .form-group {
  margin-bottom: 1.25rem;
}

.auth-form label {
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.auth-form input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  background: #fafafa;
}

.auth-form input:focus {
  outline: none;
  border-color: #dc2626;
  background: #fff;
}

.auth-error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
}

.submit-button {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, #dc2626 0%, #000000 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: scale(1.02);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  text-decoration: underline;
}

.link-btn:hover {
  color: #b91c1c;
}
</style>
