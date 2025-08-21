// backend/test-login.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1950124689Ju@localhost:5432/apprutas',
});

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function testLogin() {
  console.log(colors.cyan + '\n🔍 TEST DE LOGIN Y CONTRASEÑAS\n' + colors.reset);
  console.log('=' .repeat(60));

  try {
    // 1. Verificar conexión
    await pool.query('SELECT NOW()');
    console.log(colors.green + '✅ Conexión a PostgreSQL exitosa\n' + colors.reset);

    // 2. Crear un usuario de prueba con contraseña conocida
    const testEmail = `test_${Date.now()}@test.com`;
    const testPassword = 'Test123456';
    const testName = 'Usuario de Prueba';

    console.log(colors.blue + '📝 CREANDO USUARIO DE PRUEBA:' + colors.reset);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Contraseña: ${testPassword}`);
    console.log(`   Nombre: ${testName}\n`);

    // 3. Hashear la contraseña
    console.log(colors.yellow + '🔐 Hasheando contraseña...' + colors.reset);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log(`   Salt rounds: 10`);
    console.log(`   Hash generado: ${hashedPassword.substring(0, 20)}...`);
    console.log(`   Longitud del hash: ${hashedPassword.length} caracteres\n`);

    // 4. Insertar el usuario en la BD
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, password_hash`,
      [testEmail, hashedPassword, testName, true, false]
    );

    const createdUser = insertResult.rows[0];
    console.log(colors.green + '✅ Usuario creado en la base de datos' + colors.reset);
    console.log(`   ID: ${createdUser.id}`);
    console.log(`   Hash guardado: ${createdUser.password_hash.substring(0, 20)}...\n`);

    // 5. Verificar que el hash se guardó correctamente
    console.log(colors.yellow + '🔍 Verificando hash guardado...' + colors.reset);
    const userFromDb = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [testEmail]
    );

    const storedHash = userFromDb.rows[0].password_hash;
    console.log(`   Hash recuperado: ${storedHash.substring(0, 20)}...`);
    console.log(`   ¿Hashes coinciden? ${storedHash === hashedPassword ? '✅ SÍ' : '❌ NO'}\n`);

    // 6. Probar bcrypt.compare con diferentes escenarios
    console.log(colors.blue + '🧪 PRUEBAS DE BCRYPT.COMPARE:' + colors.reset);
    console.log('-'.repeat(40));

    // Test 1: Contraseña correcta
    console.log('\nTest 1: Contraseña correcta');
    const test1 = await bcrypt.compare(testPassword, storedHash);
    console.log(`   Entrada: "${testPassword}"`);
    console.log(`   Resultado: ${test1 ? colors.green + '✅ VÁLIDA' : colors.red + '❌ INVÁLIDA'} ${colors.reset}`);

    // Test 2: Contraseña incorrecta
    console.log('\nTest 2: Contraseña incorrecta');
    const test2 = await bcrypt.compare('WrongPassword', storedHash);
    console.log(`   Entrada: "WrongPassword"`);
    console.log(`   Resultado: ${test2 ? colors.red + '❌ VÁLIDA (ERROR!)' : colors.green + '✅ INVÁLIDA (CORRECTO)'} ${colors.reset}`);

    // Test 3: Contraseña con espacios
    console.log('\nTest 3: Contraseña con espacios');
    const test3 = await bcrypt.compare(' ' + testPassword + ' ', storedHash);
    console.log(`   Entrada: " ${testPassword} " (con espacios)`);
    console.log(`   Resultado: ${test3 ? colors.red + '❌ VÁLIDA' : colors.green + '✅ INVÁLIDA'} ${colors.reset}`);

    // Test 4: Contraseña en minúsculas
    console.log('\nTest 4: Contraseña en minúsculas');
    const test4 = await bcrypt.compare(testPassword.toLowerCase(), storedHash);
    console.log(`   Entrada: "${testPassword.toLowerCase()}"`);
    console.log(`   Resultado: ${test4 ? colors.red + '❌ VÁLIDA' : colors.green + '✅ INVÁLIDA'} ${colors.reset}`);

    // 7. Simular el proceso de login completo
    console.log(colors.magenta + '\n📱 SIMULANDO PROCESO DE LOGIN COMPLETO:' + colors.reset);
    console.log('-'.repeat(40));

    async function simulateLogin(email, password) {
      console.log(`\nIntentando login con:`);
      console.log(`   Email: ${email}`);
      console.log(`   Contraseña: ${password}`);

      // Buscar usuario
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email.toLowerCase().trim()]
      );

      if (result.rows.length === 0) {
        console.log(colors.red + '   ❌ Usuario no encontrado' + colors.reset);
        return false;
      }

      const user = result.rows[0];
      console.log(`   ✅ Usuario encontrado: ${user.full_name}`);

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log(`   Verificación de contraseña: ${validPassword ? colors.green + 'EXITOSA ✅' : colors.red + 'FALLIDA ❌'} ${colors.reset}`);

      return validPassword;
    }

    // Probar login con credenciales correctas
    console.log(colors.cyan + '\n➤ Login con credenciales correctas:' + colors.reset);
    await simulateLogin(testEmail, testPassword);

    // Probar login con email en mayúsculas
    console.log(colors.cyan + '\n➤ Login con email en MAYÚSCULAS:' + colors.reset);
    await simulateLogin(testEmail.toUpperCase(), testPassword);

    // Probar login con contraseña incorrecta
    console.log(colors.cyan + '\n➤ Login con contraseña incorrecta:' + colors.reset);
    await simulateLogin(testEmail, 'ContraseñaIncorrecta');

    // 8. Verificar usuarios existentes
    console.log(colors.yellow + '\n📊 USUARIOS EXISTENTES EN LA BD:' + colors.reset);
    console.log('-'.repeat(40));

    const existingUsers = await pool.query(`
      SELECT 
        email, 
        full_name, 
        LENGTH(password_hash) as hash_length,
        SUBSTRING(password_hash, 1, 7) as hash_prefix,
        is_active,
        created_at
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`\nÚltimos 5 usuarios registrados:`);
    existingUsers.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.full_name}`);
      console.log(`   Hash prefix: ${user.hash_prefix}...`);
      console.log(`   Longitud hash: ${user.hash_length} caracteres`);
      console.log(`   Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`);
    });

    // 9. Probar con un usuario real si proporcionas credenciales
    console.log(colors.magenta + '\n🔐 PRUEBA MANUAL DE LOGIN:' + colors.reset);
    console.log('-'.repeat(40));
    console.log('\nPara probar con un usuario específico, modifica estas variables:');
    
    // MODIFICAR ESTAS LÍNEAS CON TUS CREDENCIALES REALES
    const realEmail = 'briggitxde@gmail.com'; // <- CAMBIA ESTO
    const realPassword = '1950124689Ju';      // <- CAMBIA ESTO

    if (realEmail !== 'tu_email_real@example.com') {
      console.log(colors.cyan + '\n➤ Probando con usuario real:' + colors.reset);
      const realLoginSuccess = await simulateLogin(realEmail, realPassword);
      
      if (!realLoginSuccess) {
        console.log(colors.yellow + '\n💡 POSIBLES SOLUCIONES:' + colors.reset);
        console.log('1. Verifica que la contraseña sea exactamente la misma (mayúsculas/minúsculas)');
        console.log('2. Asegúrate de que no haya espacios extras');
        console.log('3. Si el problema persiste, crea un nuevo usuario');
      }
    } else {
      console.log('\n⚠️  Para probar con un usuario real, edita las variables realEmail y realPassword en el script');
    }

    // 10. Limpiar usuario de prueba
    console.log(colors.yellow + '\n🧹 Limpiando usuario de prueba...' + colors.reset);
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('   ✅ Usuario de prueba eliminado');

    // Resumen final
    console.log(colors.green + '\n' + '='.repeat(60) + colors.reset);
    console.log(colors.green + '✅ PRUEBAS COMPLETADAS' + colors.reset);
    console.log('='.repeat(60));

  } catch (error) {
    console.error(colors.red + '\n❌ ERROR:' + colors.reset, error.message);
    console.log('\n' + colors.yellow + 'Stack trace:' + colors.reset);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Script para resetear contraseña de un usuario específico
async function resetUserPassword(email, newPassword) {
  console.log(colors.cyan + '\n🔄 RESET DE CONTRASEÑA\n' + colors.reset);
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
      [hashedPassword, email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      console.log(colors.green + `✅ Contraseña actualizada para: ${email}` + colors.reset);
      console.log(`   Nueva contraseña: ${newPassword}`);
      return true;
    } else {
      console.log(colors.red + `❌ Usuario no encontrado: ${email}` + colors.reset);
      return false;
    }
  } catch (error) {
    console.error(colors.red + 'Error reseteando contraseña:' + colors.reset, error);
    return false;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'reset' && args[1] && args[2]) {
    // Uso: node test-login.js reset email@example.com nuevaContraseña
    await resetUserPassword(args[1], args[2]);
    await pool.end();
  } else {
    // Ejecutar todas las pruebas
    await testLogin();
    
    // Mensaje de ayuda
    console.log(colors.cyan + '\n💡 COMANDOS ADICIONALES:' + colors.reset);
    console.log('Para resetear una contraseña:');
    console.log('  node test-login.js reset email@example.com nuevaContraseña');
  }
}

// Ejecutar
main().catch(console.error);