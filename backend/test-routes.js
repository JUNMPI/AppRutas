// test-routes.js - Guarda en backend/
// Ejecuta con: node test-routes.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1950124689Ju@localhost:5432/apprutas',
});

async function testRoutes() {
  console.log('🔍 VERIFICACIÓN DE RUTAS EN LA BASE DE DATOS\n');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar conexión
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa\n');

    // 2. Contar usuarios
    const usersResult = await pool.query('SELECT COUNT(*) as count, array_agg(email) as emails FROM users');
    console.log(`📊 Usuarios encontrados: ${usersResult.rows[0].count}`);
    if (usersResult.rows[0].count > 0) {
      console.log(`   Emails: ${usersResult.rows[0].emails.join(', ')}`);
    }

    // 3. Contar rutas
    const routesResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as users_with_routes
      FROM routes 
      WHERE deleted_at IS NULL
    `);
    console.log(`\n📍 Rutas totales: ${routesResult.rows[0].total}`);
    console.log(`   Usuarios con rutas: ${routesResult.rows[0].users_with_routes}`);

    // 4. Ver detalles de las rutas
    const routesDetails = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.day_of_week,
        r.created_at,
        u.email as user_email,
        COUNT(rw.id) as waypoint_count
      FROM routes r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN route_waypoints rw ON r.id = rw.route_id
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, r.name, r.day_of_week, r.created_at, u.email
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    if (routesDetails.rows.length > 0) {
      console.log('\n📋 Últimas 5 rutas creadas:');
      console.log('-'.repeat(50));
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      routesDetails.rows.forEach((route, index) => {
        console.log(`\n${index + 1}. ${route.name}`);
        console.log(`   Usuario: ${route.user_email}`);
        console.log(`   Día: ${dayNames[route.day_of_week]}`);
        console.log(`   Puntos: ${route.waypoint_count}`);
        console.log(`   Creada: ${new Date(route.created_at).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️ No hay rutas guardadas en la base de datos');
    }

    // 5. Verificar waypoints
    const waypointsResult = await pool.query(`
      SELECT COUNT(*) as count FROM route_waypoints
    `);
    console.log(`\n📌 Total de waypoints: ${waypointsResult.rows[0].count}`);

    // 6. Crear una ruta de prueba
    console.log('\n' + '=' .repeat(50));
    console.log('🧪 CREANDO RUTA DE PRUEBA...\n');

    // Buscar un usuario para la prueba
    const userForTest = await pool.query('SELECT id, email FROM users LIMIT 1');
    
    if (userForTest.rows.length > 0) {
      const testUserId = userForTest.rows[0].id;
      const testUserEmail = userForTest.rows[0].email;
      
      console.log(`Usando usuario: ${testUserEmail}`);

      // Crear ruta de prueba
      const newRoute = await pool.query(`
        INSERT INTO routes (
          user_id, 
          name, 
          description, 
          day_of_week, 
          start_time,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name
      `, [
        testUserId,
        `Ruta de Prueba ${new Date().getTime()}`,
        'Esta es una ruta creada por el script de prueba',
        new Date().getDay(), // Día actual
        '10:00:00',
        true
      ]);

      console.log(`✅ Ruta creada: ${newRoute.rows[0].name}`);
      const routeId = newRoute.rows[0].id;

      // Crear waypoints de prueba
      const waypoints = [
        { name: 'Inicio - Almacén', lat: -6.7701, lng: -79.8405, order: 0, type: 'start' },
        { name: 'Parada 1', lat: -6.7720, lng: -79.8420, order: 1, type: 'stop' },
        { name: 'Parada 2', lat: -6.7735, lng: -79.8435, order: 2, type: 'stop' },
        { name: 'Final - Almacén', lat: -6.7701, lng: -79.8405, order: 3, type: 'end' }
      ];

      for (const wp of waypoints) {
        await pool.query(`
          INSERT INTO route_waypoints (
            route_id, name, latitude, longitude, order_index, waypoint_type
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [routeId, wp.name, wp.lat, wp.lng, wp.order, wp.type]);
      }

      console.log(`✅ ${waypoints.length} waypoints creados`);

      // Verificar la ruta creada
      const verifyRoute = await pool.query(`
        SELECT 
          r.name,
          COUNT(rw.id) as waypoint_count
        FROM routes r
        LEFT JOIN route_waypoints rw ON r.id = rw.route_id
        WHERE r.id = $1
        GROUP BY r.name
      `, [routeId]);

      console.log(`\n📊 Verificación de la ruta creada:`);
      console.log(`   Nombre: ${verifyRoute.rows[0].name}`);
      console.log(`   Waypoints: ${verifyRoute.rows[0].waypoint_count}`);

    } else {
      console.log('❌ No hay usuarios en la base de datos');
      console.log('   Ejecuta primero: node create-test-user.js');
    }

    // 7. Resumen final
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESUMEN FINAL:\n');

    const finalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
        (SELECT COUNT(*) FROM routes WHERE deleted_at IS NULL) as total_routes,
        (SELECT COUNT(*) FROM route_waypoints) as total_waypoints,
        (SELECT COUNT(*) FROM route_executions) as total_executions
    `);

    const stats = finalStats.rows[0];
    console.log(`Usuarios: ${stats.total_users}`);
    console.log(`Rutas: ${stats.total_routes}`);
    console.log(`Waypoints: ${stats.total_waypoints}`);
    console.log(`Ejecuciones: ${stats.total_executions}`);

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPosibles soluciones:');
    console.log('1. Verifica que PostgreSQL esté corriendo');
    console.log('2. Verifica las credenciales en backend/.env');
    console.log('3. Asegúrate de que la base de datos "apprutas" existe');
    console.log('4. Ejecuta el script SQL: psql -U postgres -d apprutas -f src/sql/init.sql');
  } finally {
    await pool.end();
  }
}

// Ejecutar la prueba
testRoutes().catch(console.error);