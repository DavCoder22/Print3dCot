# Print3dCot - Plataforma de Cotización de Impresión 3D

Plataforma web para cotizar servicios de impresión 3D, keycaps personalizados y restauración técnica.

🌐 **Frontend:** https://davcoder22.github.io/Print3dCot/
🔧 **Backend:** https://print3dcot-api.onrender.com/

## Stack

| Capa       | Tecnología                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | Vue 3, TypeScript, Vite, jsPDF                               |
| Backend    | Node.js, Express, JWT, bcryptjs                              |
| Auth       | JWT en cookie httpOnly + `Authorization: Bearer` (cross-origin) |
| Infra      | GitHub Pages (frontend), Render (backend), Docker            |

## Cómo funciona

```
    LOCAL                     GITHUB                       NUBE
 ┌──────────┐    git push    ┌──────────┐    auto-deploy   ┌────────────────┐
 │  Código   │──────────────>│   main   │─────────────────>│  Render        │
 │  fuente   │               │          │                  │  print3dcot-   │
 │           │               │          │                  │  api.onrender  │
 └──────────┘               │          │                  │  .com          │
                             │          │                  │                │
                             │ Actions  │                  │ Express API    │
                             │  build   │                  │ JWT + bcrypt   │
                             │  deploy  │                  │ users.json     │
                             │    │     │                  └────────────────┘
                             │    ▼     │
                             │ ┌──────┐ │
                             │ │Pages │ │
                             │ │gh-pag│ │
                             │ │es    │ │
                             │ └──────┘ │
                             │          │
                             │ davcoder │
                             │ 22.github│
                             │ .io/Print│
                             │ 3dCot/   │
                             └──────────┘
```

| Paso | Qué pasa |
|------|----------|
| 1 | Haces `git push` a `main` |
| 2 | **GitHub Actions** build el frontend (`npm run build`) y lo sube a la branch `gh-pages` |
| 3 | **GitHub Pages** sirve el frontend en `davcoder22.github.io/Print3dCot/` |
| 4 | **Render** detecta el push y redeploya el backend automáticamente |
| 5 | El frontend llama al backend mediante `VITE_API_URL` (variable de entorno) |

> Si el backend no está disponible (ej: Render en free tier se duerme), el frontend activa **modo demo** automáticamente — los usuarios se guardan en localStorage.

## Desarrollo local

### Backend

```bash
cd backend
npm install
npm run dev     # http://localhost:3000
```

### Frontend

```bash
cd impr3q
npm install
npm run dev     # http://localhost:5173
```

> En desarrollo, Vite redirige `/api` al backend automáticamente (proxy configurado).

## Despliegue

### Frontend → GitHub Pages (automático)

Cada push a `main` build y deploy automático. Para configurar:

1. Ve a **Settings → Pages** del repo
2. **Source:** `Deploy from a branch`
3. **Branch:** `gh-pages` → `/ (root)`
4. **Save**

### Backend → Render (automático)

El repositorio incluye un `render.yaml` para Blueprint, o puedes hacerlo manual:

1. Ve a https://dashboard.render.com → **New + → Web Service**
2. Conecta tu repositorio `DavCoder22/Print3dCot`
3. Configura:

| Campo | Valor |
|-------|-------|
| **Name** | `print3dcot-api` |
| **Runtime** | Node |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

4. En **Advanced → Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate |
| `CLIENT_ORIGIN` | `https://davcoder22.github.io` |

5. Crea el servicio. Render te dará una URL como `https://print3dcot-api.onrender.com`

### Conectar Frontend con Backend

Para que el frontend use el backend real en lugar del modo demo:

1. Ve a **GitHub → Settings → Secrets and variables → Actions → New repository secret**
2. **Name:** `VITE_API_URL`
3. **Value:** `https://print3dcot-api.onrender.com`

Luego haz push a `main` — el workflow rebuildeará el frontend apuntando al backend.

## API

| Método | Ruta                 | Descripción            |
|--------|----------------------|------------------------|
| GET    | `/`                  | Estado de la API       |
| GET    | `/api/health`        | Health check           |
| POST   | `/api/auth/register` | Registrar usuario      |
| POST   | `/api/auth/login`    | Iniciar sesión         |
| POST   | `/api/auth/logout`   | Cerrar sesión          |
| GET    | `/api/auth/me`       | Obtener usuario actual |

## Docker

```bash
docker compose up -d --build
# Frontend: http://localhost:8081
# Backend:  http://localhost:3000
```

## Estructura

```
Print3dCot/
├── backend/                 # API REST (Express)
│   ├── src/index.js
│   ├── scripts/generate-certs.js
│   └── Dockerfile
├── impr3q/                  # Frontend (Vue 3 + Vite)
│   ├── src/
│   │   ├── components/      # Login, Register
│   │   ├── services/        # api.ts, auth.ts
│   │   └── App.vue
│   ├── nginx.conf
│   └── Dockerfile
├── .github/workflows/       # GitHub Actions (deploy.yml)
├── render.yaml              # Blueprint Render
└── docker-compose.yml
```

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT en cookie httpOnly + SameSite=None (HTTPS)
- Soporte `Authorization: Bearer` para cross-origin
- CORS con orígenes permitidos (localhost, GitHub Pages)
- Tokens expiran a los 7 días
