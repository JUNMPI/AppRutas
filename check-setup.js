// check-setup.js
// Guarda este archivo en: C:\ReactNativeProyectos\AppRutas\check-setup.js

const os = require('os');
const http = require('http');

console.log('🔍 VERIFICACIÓN DEL ENTORNO DE DESARROLLO\n');
console.log('=' .repeat(50));

// 1. Obtener IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.100.4';
}

const localIP = getLocalIP();
console.log('\n📱 CONFIGURACIÓN DE RED:');
console.log('------------------------');
console.log(`Tu IP local es: ${localIP}`);
console.log(`\n⚠️  IMPORTANTE: Actualiza esta IP en:`);
console.log(`   1. services/api.ts (línea 14)`);
console.log(`      Cambia: return 'http://192.168.100.4:5000/api'`);
console.log(`      Por:    return 'http://${localIP}:5000/api'`);
console.log(`   2. backend/.env (si existe REACT_NATIVE_PACKAGER_HOSTNAME)`);

// 2. Verificar backend
console.log('\n🔌 VERIFICANDO BACKEND:');
console.log('------------------------');

function checkURL(url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${url} - OK`);
        resolve(true);
      } else {
        console.log(`⚠️  ${url} - Respondió con código ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`❌ ${url} - No responde`);
      resolve(false);
    });
  });
}

async function checkBackend() {
  const urls = [
    `http://localhost:5000/health`,
    `http://${localIP}:5000/health`,
    `http://127.0.0.1:5000/health`
  ];

  let anyWorking = false;
  for (const url of urls) {
    const result = await checkURL(url);
    if (result) anyWorking = true;
  }
  return anyWorking;
}

// 3. Verificar PostgreSQL
console.log('\n🐘 VERIFICANDO POSTGRESQL:');
console.log('------------------------');

async function checkDatabase() {
  try {
    const { Pool } = require('pg');
    
    // Intentar cargar las variables de entorno
    try {
      require('dotenv').config({ path: './backend/.env' });
    } catch (e) {
      console.log('⚠️  No se pudo cargar .env, usando valores por defecto');
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1950124689Ju@localhost:5432/apprutas',
    });

    const result = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado');
    
    // Verificar tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log(`✅ ${tables.rows.length} tablas encontradas:`);
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No hay tablas - necesitas ejecutar el script SQL');
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Error conectando a PostgreSQL:', error.message);
    console.log('   Asegúrate de que PostgreSQL esté corriendo');
    return false;
  }
}

// 4. Ejecutar verificaciones
async function runChecks() {
  console.log('\n🚀 INICIANDO VERIFICACIÓN...\n');
  
  const backendOk = await checkBackend();
  const dbOk = await checkDatabase();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMEN:');
  console.log('-----------');
  console.log(`Backend: ${backendOk ? '✅ OK' : '❌ No está corriendo'}`);
  console.log(`Base de datos: ${dbOk ? '✅ OK' : '❌ No conectada'}`);
  console.log(`IP Local: ${localIP}`);
  
  if (!backendOk || !dbOk) {
    console.log('\n📝 PASOS PARA SOLUCIONAR:');
    console.log('-------------------------');
    
    if (!dbOk) {
      console.log('\n1. CONFIGURAR POSTGRESQL:');
      console.log('   a) Asegúrate de que PostgreSQL esté corriendo');
      console.log('   b) Abre pgAdmin o psql');
      console.log('   c) Crea la base de datos:');
      console.log('      CREATE DATABASE apprutas;');
      console.log('   d) Ejecuta el script SQL:');
      console.log('      cd backend');
      console.log('      psql -U postgres -d apprutas -f src/sql/init.sql');
    }
    
    if (!backendOk) {
      console.log('\n2. INICIAR BACKEND:');
      console.log('   Abre una nueva terminal y ejecuta:');
      console.log('   cd backend');
      console.log('   npm install (si no lo has hecho)');
      console.log('   npm run dev');
      console.log('   ');
      console.log('   Deberías ver:');
      console.log('   🚀 Servidor corriendo en http://localhost:5000');
    }
    
    console.log('\n3. ACTUALIZAR IP EN LA APP:');
    console.log(`   Abre: services/api.ts`);
    console.log(`   Busca la línea 14 y cambia:`);
    console.log(`   return 'http://192.168.100.4:5000/api'`);
    console.log(`   Por:`);
    console.log(`   return 'http://${localIP}:5000/api'`);
    
    console.log('\n4. REINICIAR LA APP:');
    console.log('   - Presiona "r" en el terminal de Expo');
    console.log('   - O cierra y vuelve a abrir la app en Expo Go');
  } else {
    console.log('\n✅ ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE!');
    console.log('\nSi aún tienes problemas:');
    console.log('1. Verifica que el dispositivo esté en la misma red WiFi');
    console.log('2. Desactiva temporalmente el firewall de Windows');
    console.log('3. Reinicia completamente Expo Go en tu teléfono');
    console.log(`4. Asegúrate de que la IP en services/api.ts sea: ${localIP}`);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n💡 COMANDOS ÚTILES:');
  console.log('-------------------');
  console.log('Backend:        cd backend && npm run dev');
  console.log('Frontend:       npx expo start');
  console.log('Test backend:   cd backend && node test-db.js');
  console.log('Crear usuario:  cd backend && node create-test-user.js');
  console.log('\n' + '=' .repeat(50));
}

runChecks().catch(console.error);