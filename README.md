# Print3dCot - Plataforma de Cotización de Impresión 3D

Plataforma web para cotizar servicios de impresión 3D, keycaps personalizados y restauración técnica. Construida con **Vue 3 + TypeScript** (frontend) y **Node.js + Express** (backend).

## Características

- Cotizador de impresión 3D con cálculo de costos por material, peso y tiempo
- Generación de proformas en PDF
- Autenticación de usuarios (registro/login con JWT)
- Soporte para múltiples ítems por cotización
- Subida de imágenes de referencia
- Despliegue con Docker

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
- JWT almacenado en cookie httpOnly, SameSite=Strict
- CORS configurado con origen específico
- HTTPS disponible con certs autofirmados
- Tokens expiran a los 7 días
