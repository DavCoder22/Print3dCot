# Print3dCot - Plataforma de Cotización de Impresión 3D

Plataforma web para cotizar servicios de impresión 3D, keycaps personalizados y restauración técnica. Construida con **Vue 3 + TypeScript** (frontend) y **Node.js + Express** (backend).

## Características

- Cotizador de impresión 3D con cálculo de costos por material, peso y tiempo
- Generación de proformas en PDF
- Autenticación de usuarios (registro/login con JWT)
- Soporte para múltiples ítems por cotización
- Subida de imágenes de referencia
- Despliegue con Docker

🌐 **Demo en GitHub Pages:** https://davcoder22.github.io/Print3dCot/

> El modo demo usa almacenamiento local (localStorage) para la autenticación — no requiere backend.

## Stack

| Capa       | Tecnología                                |
|------------|-------------------------------------------|
| Frontend   | Vue 3, TypeScript, Vite, jsPDF            |
| Backend    | Node.js, Express, JWT, bcryptjs           |
| Auth       | Cookies httpOnly + JWT                    |
| Infra      | Docker, Docker Compose, Nginx             |

## Requisitos

- Node.js 20+
- Docker y Docker Compose (para despliegue)
- OpenSSL (para certificados HTTPS)

## Desarrollo

### 1. Backend

```bash
cd backend
npm install
npm run dev     # http://localhost:3000
```

### 2. Frontend

```bash
cd impr3q
npm install
npm run dev     # http://localhost:5173
```

> El frontend en dev usa Vite proxy para redirigir `/api` al backend.

### HTTPS (opcional)

```bash
cd backend
npm run certs   # Genera certs autofirmados en certs/
```

El backend detecta automáticamente los certificados y sirve HTTPS.

## GitHub Pages

El frontend se despliega automáticamente a GitHub Pages mediante GitHub Actions al hacer push a `main`.

1. Ve a **Settings → Pages** del repositorio
2. En **Source**, selecciona **GitHub Actions**
3. El workflow ya está configurado (`.github/workflows/deploy.yml`)

URL: `https://davcoder22.github.io/Print3dCot/`

## Despliegue en Render (Backend)

### Opción 1: Usando render.yaml (Blueprint)

El repositorio incluye un `render.yaml` para despliegue automatizado:

1. Ve a https://dashboard.render.com/select-repo
2. Conecta tu repositorio `DavCoder22/Print3dCot`
3. Render detectará automáticamente el `render.yaml`
4. Haz clic en **Apply**

### Opción 2: Manual

1. En Render Dashboard → **New + → Web Service**
2. Conecta tu repositorio `DavCoder22/Print3dCot`
3. Configura:
   - **Name:** `print3dcot-api`
   - **Runtime:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free
4. En **Advanced → Environment Variables**:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generar valor seguro)
   - `CLIENT_ORIGIN`: `https://davcoder22.github.io`

### Conectar Frontend con Backend

Una vez que el backend esté en Render (ej: `https://print3dcot-api.onrender.com`):

1. Ve a **Settings → Secrets and variables → Actions** en tu repo de GitHub
2. Agrega un **New repository secret**:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://print3dcot-api.onrender.com`
3. El próximo push a `main` rebuildeará el frontend apuntando a tu backend

## Despliegue con Docker

```bash
# Linux/Mac
docker compose up -d --build

# Windows
desplegar.bat
```

| Servicio  | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:8081      |
| Backend   | http://localhost:3000      |

## API

### Autenticación

| Método | Ruta                 | Descripción            |
|--------|----------------------|------------------------|
| POST   | `/api/auth/register` | Registrar usuario      |
| POST   | `/api/auth/login`    | Iniciar sesión         |
| POST   | `/api/auth/logout`   | Cerrar sesión          |
| GET    | `/api/auth/me`       | Obtener usuario actual |

### Salud

| Método | Ruta            | Descripción           |
|--------|-----------------|-----------------------|
| GET    | `/api/health`   | Health check          |

## Estructura

```
proyectoPrint3d/
├── backend/                 # API REST (Express)
│   ├── src/index.js
│   ├── scripts/generate-certs.js
│   └── Dockerfile
├── impr3q/                  # Frontend (Vue 3)
│   ├── src/
│   │   ├── components/      # Componentes Vue
│   │   ├── services/        # API y auth services
│   │   └── App.vue
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- JWT en cookie httpOnly + SameSite=None (HTTPS) o Strict (HTTP)
- Soporte para autenticación vía `Authorization: Bearer` (cross-origin)
- CORS configurado con orígenes permitidos (localhost, GitHub Pages)
- HTTPS en producción (Render/GitHub Pages)
- Tokens expiran a los 7 días
