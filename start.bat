@echo off
SET PORT=3400
echo.
echo ==========================================
echo    ABDAuth - GESTOR DE IDENTIDAD
echo ==========================================
echo.

echo [0/3] Comprobando si el puerto %PORT% esta ocupado...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') DO (
    echo [0/3] Proceso encontrado: PID %%P. Terminando...
    taskkill /F /PID %%P >nul 2>&1
)
echo [0/3] Puerto %PORT% disponible.

REM Segun la estructura actual, el package.json esta en la raiz
IF NOT EXIST node_modules (
    echo [1/3] Instalando dependencias necesarias con npm...
    call npm install
) ELSE (
    echo [1/3] Dependencias ya instaladas.
)

echo [2/3] Iniciando servidor en puerto %PORT%...
REM Ajustamos la ruta si es necesario. Si el src esta dentro de abd-auth-web/src
REM Next.js suele buscar la carpeta src/app o app/
start /b npm run dev -- -p %PORT%

echo [3/3] Abriendo navegador en http://localhost:%PORT%...
timeout /t 5 /nobreak >nul
start http://localhost:%PORT%

echo.
echo ABDAuth listo y corriendo en segundo plano.
echo Presiona Ctrl+C en esta ventana para detener el servidor.
echo.
pause
