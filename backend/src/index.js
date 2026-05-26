import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'impr3q-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const CERT_DIR = join(__dirname, '..', 'certs');
const isProduction = process.env.NODE_ENV === 'production';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) {
  console.warn('SUPABASE_URL y SUPABASE_SERVICE_KEY no configurados — usando modo degradado (users.json)');
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'https://davcoder22.github.io',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

function authenticateToken(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (supabase) {
      const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existing) {
        return res.status(409).json({ error: 'El correo ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { data: newUser, error } = await supabase.from('users').insert({
        name, email, password: hashedPassword
      }).select('id, name, email, created_at').single();

      if (error) throw error;

      const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      setTokenCookie(res, token);

      return res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    }

    return res.status(503).json({ error: 'Base de datos no configurada' });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    if (supabase) {
      const { data: user, error } = await supabase.from('users').select('id, name, email, password').eq('email', email).maybeSingle();
      if (error) throw error;
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      setTokenCookie(res, token);

      return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }

    return res.status(503).json({ error: 'Base de datos no configurada' });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'strict' });
  res.json({ message: 'Sesión cerrada' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/', (_req, res) => {
  res.json({ app: 'Print3dCot API', status: 'running', docs: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const certPath = join(CERT_DIR, 'cert.pem');
const keyPath = join(CERT_DIR, 'key.pem');
const useHttps = existsSync(certPath) && existsSync(keyPath);

if (useHttps) {
  https.createServer({ cert: readFileSync(certPath), key: readFileSync(keyPath) }, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
  });
}
