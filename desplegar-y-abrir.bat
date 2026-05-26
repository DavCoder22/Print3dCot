@echo off
chcp 65001 >nul
echo ==========================================
echo   impr3q - Despliegue y Ejecución
echo ==========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no está instalado o no está en el PATH
    pause
    exit /b 1
)

echo [1/4] Verificando contenedores existentes...
docker compose down -v >nul 2>&1

echo.
echo [2/4] Construyendo imágenes Docker...
docker compose build
if %errorlevel% neq 0 (
    echo ERROR al construir imágenes
    pause
    exit /b 1
)

echo.
echo [3/4] Iniciando servicios...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR al iniciar servicios
    pause
    exit /b 1
)

echo.
echo [4/4] Esperando que los servicios estén listos...
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo   Servicios iniciados correctamente
echo ==========================================
echo.
echo Frontend:  http://localhost:8081
echo Backend:  http://localhost:3000
echo.
echo Abriendo navegador...
start http://localhost:8081

echo.
echo Comandos:
echo   docker compose logs -f    - Ver logs en tiempo real
echo   docker compose down      - Detener servicios
echo.
pause