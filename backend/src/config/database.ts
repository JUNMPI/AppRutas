import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.log('💡 Verifica:');
    console.log('  1. Que PostgreSQL esté corriendo');
    console.log('  2. La contraseña en .env sea correcta');
    console.log('  3. La base de datos "apprutas" exista');
  } else {
    release();
    console.log('✅ PostgreSQL conectado');
    
    // Verificar tablas
    pool.query('SELECT COUNT(*) FROM users', (error, result) => {
      if (error) {
        console.log('⚠️  Tablas no encontradas - ejecuta el script SQL');
      } else {
        console.log(`✅ Base de datos lista - ${result.rows[0].count} usuarios encontrados`);
      }
    });
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL perdió conexión:', err);
});

export default pool;