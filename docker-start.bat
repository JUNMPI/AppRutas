@echo off
echo ========================================
echo    AppRutas Docker - Inicio Rapido
echo ========================================
echo.

:MENU
echo Que deseas hacer?
echo.
echo 1. Iniciar todo (primera vez)
echo 2. Iniciar servicios
echo 3. Detener servicios
echo 4. Ver logs del backend
echo 5. Crear usuario de prueba
echo 6. Limpiar todo y empezar de cero
echo 7. Salir
echo.

set /p opcion="Selecciona una opcion (1-7): "

if "%opcion%"=="1" goto INIT
if "%opcion%"=="2" goto START
if "%opcion%"=="3" goto STOP
if "%opcion%"=="4" goto LOGS
if "%opcion%"=="5" goto USER
if "%opcion%"=="6" goto CLEAN
if "%opcion%"=="7" goto END

echo Opcion invalida
pause
cls
goto MENU

:INIT
echo.
echo Construyendo e iniciando todos los servicios...
docker-compose build --no-cache
docker-compose up -d
echo.
echo Esperando a que los servicios esten listos...
timeout /t 10 /nobreak > nul
echo.
echo Creando usuario de prueba...
docker-compose exec backend node -e "const bcrypt=require('bcrypt');const {Pool}=require('pg');const pool=new Pool({connectionString:'postgresql://postgres:postgres123@postgres:5432/apprutas'});(async()=>{try{const hash=await bcrypt.hash('demo123',10);await pool.query('INSERT INTO users (email,password_hash,full_name,is_active,email_verified) VALUES ($1,$2,$3,true,true) ON CONFLICT (email) DO NOTHING',['demo@test.com',hash,'Usuario Demo']);console.log('Usuario creado: demo@test.com / demo123');}catch(e){console.error(e);}finally{await pool.end();}})();"
echo.
echo ========================================
echo    TODO LISTO!
echo ========================================
echo.
echo Accede a:
echo   - Expo: http://localhost:8081
echo   - Backend: http://localhost:5000/health
echo.
echo Usuario de prueba:
echo   Email: demo@test.com
echo   Password: demo123
echo.
pause
cls
goto MENU

:START
echo.
echo Iniciando servicios...
docker-compose up -d
echo.
echo Servicios iniciados!
echo   - Expo: http://localhost:8081
echo   - Backend: http://localhost:5000
pause
cls
goto MENU

:STOP
echo.
echo Deteniendo servicios...
docker-compose down
echo Servicios detenidos!
pause
cls
goto MENU

:LOGS
echo.
echo Mostrando logs del backend (Ctrl+C para salir)...
docker-compose logs -f backend
pause
cls
goto MENU

:USER
echo.
echo Creando usuario de prueba...
docker-compose exec backend node -e "const bcrypt=require('bcrypt');const {Pool}=require('pg');const pool=new Pool({connectionString:'postgresql://postgres:postgres123@postgres:5432/apprutas'});(async()=>{try{const hash=await bcrypt.hash('demo123',10);await pool.query('INSERT INTO users (email,password_hash,full_name,is_active,email_verified) VALUES ($1,$2,$3,true,true) ON CONFLICT (email) DO NOTHING',['demo@test.com',hash,'Usuario Demo']);console.log('Usuario: demo@test.com / demo123');}catch(e){console.error(e);}finally{await pool.end();}})();"
pause
cls
goto MENU

:CLEAN
echo.
set /p confirmar="ADVERTENCIA: Esto borrara TODO incluyendo la base de datos. Estas seguro? (s/n): "
if /i "%confirmar%"=="s" (
    echo.
    echo Limpiando todo...
    docker-compose down -v
    docker system prune -af
    echo Limpieza completa!
) else (
    echo Operacion cancelada
)
pause
cls
goto MENU

:END
echo Hasta luego!
exit