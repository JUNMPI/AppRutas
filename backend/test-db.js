const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('🔄 Intentando conectar a PostgreSQL...');
    console.log('📍 URL:', process.env.DATABASE_URL);
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa!');
    console.log('⏰ Hora del servidor:', result.rows[0].now);
    
    // Verificar si las tablas existen
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📊 Tablas en la base de datos:');
    if (tables.rows.length === 0) {
      console.log('  ⚠️ No hay tablas - necesitas ejecutar el script SQL');
    } else {
      tables.rows.forEach(row => {
        console.log('  ✓ ' + row.table_name);
      });
    }
    
    // Contar usuarios
    try {
      const users = await pool.query('SELECT COUNT(*) FROM users');
      console.log('\n👥 Usuarios en la BD:', users.rows[0].count);
    } catch (e) {
      console.log('\n⚠️ La tabla users no existe aún');
      console.log('   Ejecuta el script SQL desde pgAdmin o con:');
      console.log('   psql -U postgres -d apprutas -f src/sql/init.sql');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Sugerencias:');
    console.log('1. Verifica que PostgreSQL esté corriendo');
    console.log('2. Verifica la contraseña en el archivo .env');
    console.log('3. Asegúrate de que la base de datos "apprutas" exista');
  } finally {
    await pool.end();
  }
}

testConnection();