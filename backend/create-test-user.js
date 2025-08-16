const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Lista de usuarios de prueba
const testUsers = [
  {
    email: 'demo@test.com',
    password: 'demo123',
    fullName: 'Usuario Demo',
    phone: '999999999'
  },
  {
    email: 'juan@test.com',
    password: 'juan123456',
    fullName: 'Juan Pérez',
    phone: '987654321'
  },
  {
    email: 'maria@test.com',
    password: 'maria123456',
    fullName: 'María García',
    phone: '912345678'
  },
  {
    email: 'carlos@test.com',
    password: 'carlos123456',
    fullName: 'Carlos López',
    phone: '923456789'
  },
  {
    email: 'ana@test.com',
    password: 'ana123456',
    fullName: 'Ana Martínez',
    phone: '934567890'
  }
];

async function checkUserExists(email) {
  const result = await pool.query(
    'SELECT id, email, full_name FROM users WHERE email = $1',
    [email]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function createUser(userData) {
  const { email, password, fullName, phone } = userData;
  
  try {
    console.log(`\n📝 Intentando crear usuario: ${email}`);
    
    // Verificar si el usuario ya existe
    const existingUser = await checkUserExists(email);
    
    if (existingUser) {
      console.log(`❌ El usuario ${email} ya existe!`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nombre: ${existingUser.full_name}`);
      return false;
    }
    
    // Hashear la contraseña
    console.log('🔐 Hasheando contraseña...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear el usuario
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, full_name`,
      [email, passwordHash, fullName, phone, true, true]
    );
    
    console.log(`✅ Usuario creado exitosamente!`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Nombre: ${result.rows[0].full_name}`);
    console.log(`   Contraseña: ${password}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error al crear ${email}:`, error.message);
    
    if (error.code === '23505') {
      console.log('   -> El email ya está registrado en la base de datos');
    }
    return false;
  }
}

async function createTestUsers() {
  console.log('🚀 CREACIÓN DE USUARIOS DE PRUEBA');
  console.log('=' .repeat(50));
  
  let created = 0;
  let existing = 0;
  
  for (const user of testUsers) {
    const result = await createUser(user);
    if (result) {
      created++;
    } else {
      existing++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Usuarios creados: ${created}`);
  console.log(`   ⚠️  Usuarios existentes: ${existing}`);
  console.log(`   📋 Total procesados: ${testUsers.length}`);
  
  console.log('\n📝 USUARIOS DISPONIBLES PARA LOGIN:');
  console.log('=' .repeat(50));
  
  // Mostrar todos los usuarios disponibles
  const allUsers = await pool.query(
    'SELECT email, full_name, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10'
  );
  
  console.log('\n');
  allUsers.rows.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Nombre: ${user.full_name}`);
    console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`);
    
    // Mostrar la contraseña si es un usuario de prueba
    const testUser = testUsers.find(u => u.email === user.email);
    if (testUser) {
      console.log(`   🔑 Contraseña: ${testUser.password}`);
    }
    console.log('');
  });
  
  await pool.end();
}

// Script para verificar duplicados específicamente
async function testDuplicateValidation() {
  console.log('\n🧪 PRUEBA DE VALIDACIÓN DE DUPLICADOS');
  console.log('=' .repeat(50));
  
  const testEmail = 'prueba@test.com';
  const testData = {
    email: testEmail,
    password: 'prueba123',
    fullName: 'Usuario Prueba',
    phone: '900000000'
  };
  
  console.log(`\n1️⃣ Primer intento de crear ${testEmail}:`);
  const firstAttempt = await createUser(testData);
  
  console.log(`\n2️⃣ Segundo intento de crear ${testEmail} (debería fallar):`);
  const secondAttempt = await createUser(testData);
  
  console.log('\n' + '=' .repeat(50));
  console.log('🔍 RESULTADO DE LA PRUEBA:');
  if (!secondAttempt && firstAttempt) {
    console.log('✅ La validación de duplicados funciona correctamente!');
    console.log('   El sistema detectó que el email ya existía.');
  } else if (!firstAttempt && !secondAttempt) {
    console.log('⚠️  El usuario ya existía desde antes.');
  } else {
    console.log('❌ Hay un problema con la validación de duplicados.');
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-duplicate')) {
    await testDuplicateValidation();
  } else {
    await createTestUsers();
  }
  
  process.exit(0);
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});