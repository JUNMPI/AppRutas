const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestUser() {
  try {
    console.log('🔄 Creando usuario de prueba...');
    
    // Hashear la contraseña "demo123"
    const passwordHash = await bcrypt.hash('demo123', 10);
    console.log('🔐 Contraseña hasheada correctamente');
    
    // Crear usuario de prueba
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = $2, 
           full_name = $3,
           updated_at = NOW()
       RETURNING id, email, full_name`,
      ['demo@test.com', passwordHash, 'Usuario Demo', '999999999', true, true]
    );
    
    console.log('✅ Usuario de prueba creado/actualizado exitosamente!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email: demo@test.com');
    console.log('🔑 Contraseña: demo123');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('👤 ID Usuario:', result.rows[0].id);
    console.log('📝 Nombre:', result.rows[0].full_name);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.log('⚠️  El usuario ya existe, actualizando contraseña...');
    }
  } finally {
    await pool.end();
  }
}

createTestUser();