@echo off
chcp 65001 >nul
echo ==========================================
echo   impr3q - Despliegue Docker
echo ==========================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no esta instalado
    pause
    exit /b 1
)

echo [1/3] Deteniendo contenedores previos...
docker compose down >nul 2>&1

echo.
echo [2/3] Construyendo imagenes...
docker compose build
if %errorlevel% neq 0 (
    echo ERROR al construir
    pause
    exit /b 1
)

echo.
echo [3/3] Iniciando servicios...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR al iniciar
    pause
    exit /b 1
)

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo   OK - Servicios iniciados
echo ==========================================
echo.
echo   Frontend:  http://localhost:8081
echo   Backend:  http://localhost:3000
echo.
start http://localhost:8081
pause