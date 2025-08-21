import { Request, Response } from 'express';
import pool from '../config/database';
import { CacheManager } from '../middlewares/cache.middleware';
import { CreateRouteRequest, RouteQuery } from '../types';

export const createRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const userId = req.user!.id;
    const {
      name,
      description,
      day_of_week,
      start_time,
      waypoints,
      total_distance // NUEVO: Recibir distancia del frontend si existe
    }: CreateRouteRequest & { total_distance?: number } = req.body;

    await client.query('BEGIN');

    // Calcular distancia total (usar la del frontend si existe, sino calcular)
    let finalDistance = total_distance || 0;
    
    // Si no viene distancia del frontend, calcularla
    if (!total_distance && waypoints && waypoints.length > 1) {
      console.log('Calculando distancia en el backend...');
      for (let i = 0; i < waypoints.length - 1; i++) {
        const lat1 = waypoints[i].latitude;
        const lon1 = waypoints[i].longitude;
        const lat2 = waypoints[i + 1].latitude;
        const lon2 = waypoints[i + 1].longitude;
        
        // Fórmula de Haversine
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        finalDistance += R * c;
      }
    }

    console.log('Distancia total a guardar:', finalDistance, 'km'); // Debug

    // Crear la ruta con is_active = true por defecto
    const routeResult = await client.query(
      `INSERT INTO routes (user_id, name, description, day_of_week, start_time, total_distance, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, description, day_of_week, start_time, Math.round(finalDistance * 100) / 100, true]
    );

    const route = routeResult.rows[0];
    console.log('Ruta guardada con distancia:', route.total_distance); // Debug

    // Crear los waypoints
    const waypointPromises = waypoints.map((waypoint, index) =>
      client.query(
        `INSERT INTO route_waypoints 
         (route_id, name, description, address, latitude, longitude, order_index, estimated_duration, waypoint_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          route.id,
          waypoint.name,
          waypoint.description || null,
          waypoint.address || null,
          waypoint.latitude,
          waypoint.longitude,
          waypoint.order_index,
          waypoint.estimated_duration || 0,
          waypoint.waypoint_type || (index === 0 ? 'start' : index === waypoints.length - 1 ? 'end' : 'stop')
        ]
      )
    );

    const waypointResults = await Promise.all(waypointPromises);
    const createdWaypoints = waypointResults.map(result => result.rows[0]);

    await client.query('COMMIT');

    // Invalidar cache de rutas del usuario
    await CacheManager.invalidateUserCache(userId); // Esto invalida TODO el cache del usuario
    await CacheManager.invalidateRouteCache(userId);

    res.status(201).json({
      success: true,
      message: 'Ruta creada exitosamente',
      data: {
        ...route,
        waypoints: createdWaypoints
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creando ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la ruta',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  } finally {
    client.release();
  }
};

export const getUserRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 10,
      day_of_week,
      is_active = true,
      search,
      sort = 'created_at',
      order = 'DESC'
    }: RouteQuery = req.query as any;

    const offset = (Number(page) - 1) * Number(limit);

    // Construir query dinámicamente
    let whereConditions = ['r.user_id = $1', 'r.deleted_at IS NULL'];
    let queryParams: any[] = [userId];
    let paramIndex = 2;

    if (day_of_week !== undefined) {
      whereConditions.push(`r.day_of_week = $${paramIndex}`);
      queryParams.push(Number(day_of_week));
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`r.is_active = $${paramIndex}`);
      queryParams.push(Boolean(is_active));
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validar sort y order para evitar SQL injection
    const validSortFields = ['created_at', 'updated_at', 'name', 'day_of_week'];
    const validOrders = ['ASC', 'DESC'];
    
    const safeSortField = validSortFields.includes(sort) ? sort : 'created_at';
    const safeOrder = validOrders.includes(order) ? order : 'DESC';

    // Query principal con waypoints
    const routesQuery = `
      SELECT 
        r.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rw.id,
              'name', rw.name,
              'description', rw.description,
              'address', rw.address,
              'latitude', rw.latitude,
              'longitude', rw.longitude,
              'order_index', rw.order_index,
              'estimated_duration', rw.estimated_duration,
              'waypoint_type', rw.waypoint_type,
              'created_at', rw.created_at,
              'updated_at', rw.updated_at
            ) ORDER BY rw.order_index
          ) FILTER (WHERE rw.id IS NOT NULL), '[]'
        ) as waypoints
      FROM routes r
      LEFT JOIN route_waypoints rw ON r.id = rw.route_id
      WHERE ${whereClause}
      GROUP BY r.id
      ORDER BY r.${safeSortField} ${safeOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM routes r
      WHERE ${whereClause}
    `;

    // Solo usar los parámetros del WHERE para el count (sin limit y offset)
    const countParams = queryParams.slice(0, -2);

    console.log('Query SQL:', routesQuery);
    console.log('Params:', queryParams);

    const [routesResult, countResult] = await Promise.all([
      pool.query(routesQuery, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const routes = routesResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      message: 'Rutas obtenidas exitosamente',
      data: {
        routes,
        pagination: {
          current_page: Number(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: Number(limit),
          has_next: Number(page) < totalPages,
          has_prev: Number(page) > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo rutas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las rutas',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const getRouteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rw.id,
              'name', rw.name,
              'description', rw.description,
              'address', rw.address,
              'latitude', rw.latitude,
              'longitude', rw.longitude,
              'order_index', rw.order_index,
              'estimated_duration', rw.estimated_duration,
              'waypoint_type', rw.waypoint_type,
              'created_at', rw.created_at,
              'updated_at', rw.updated_at
            ) ORDER BY rw.order_index
          ) FILTER (WHERE rw.id IS NOT NULL), '[]'
        ) as waypoints
      FROM routes r
      LEFT JOIN route_waypoints rw ON r.id = rw.route_id
      WHERE r.id = $1 AND r.user_id = $2 AND r.deleted_at IS NULL
      GROUP BY r.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Ruta obtenida exitosamente',
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error obteniendo ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la ruta',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      description,
      day_of_week,
      start_time,
      is_active,
      waypoints,
      total_distance // NUEVO: Recibir distancia del frontend si existe
    } = req.body;

    await client.query('BEGIN');

    // Verificar que la ruta pertenece al usuario
    const routeCheck = await client.query(
      'SELECT id FROM routes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId]
    );

    if (routeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
      return;
    }

    // Actualizar información básica de la ruta
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }
    if (day_of_week !== undefined) {
      updateFields.push(`day_of_week = $${paramIndex}`);
      updateValues.push(day_of_week);
      paramIndex++;
    }
    if (start_time !== undefined) {
      updateFields.push(`start_time = $${paramIndex}`);
      updateValues.push(start_time);
      paramIndex++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(is_active);
      paramIndex++;
    }

    // NUEVO: Si vienen waypoints o distancia, actualizar la distancia
    if (waypoints && waypoints.length > 1) {
      let calculatedDistance = 0;
      
      // Si viene distancia del frontend, usarla; sino, calcular
      if (total_distance) {
        calculatedDistance = total_distance;
      } else {
        // Calcular distancia con los nuevos waypoints
        for (let i = 0; i < waypoints.length - 1; i++) {
          const lat1 = waypoints[i].latitude;
          const lon1 = waypoints[i].longitude;
          const lat2 = waypoints[i + 1].latitude;
          const lon2 = waypoints[i + 1].longitude;
          
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          calculatedDistance += R * c;
        }
      }
      
      console.log('Actualizando distancia a:', calculatedDistance, 'km'); // Debug
      updateFields.push(`total_distance = $${paramIndex}`);
      updateValues.push(Math.round(calculatedDistance * 100) / 100);
      paramIndex++;
    } else if (total_distance !== undefined) {
      // Si solo viene la distancia sin waypoints
      updateFields.push(`total_distance = $${paramIndex}`);
      updateValues.push(Math.round(total_distance * 100) / 100);
      paramIndex++;
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const updateQuery = `
        UPDATE routes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await client.query(updateQuery, updateValues);
    }

    // Si se proporcionan waypoints, actualizarlos
    if (waypoints && Array.isArray(waypoints)) {
      // Eliminar waypoints existentes
      await client.query('DELETE FROM route_waypoints WHERE route_id = $1', [id]);

      // Crear nuevos waypoints
      for (const waypoint of waypoints) {
        await client.query(
          `INSERT INTO route_waypoints 
           (route_id, name, description, address, latitude, longitude, order_index, estimated_duration, waypoint_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            waypoint.name,
            waypoint.description || null,
            waypoint.address || null,
            waypoint.latitude,
            waypoint.longitude,
            waypoint.order_index,
            waypoint.estimated_duration || 0,
            waypoint.waypoint_type || 'stop'
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Invalidar cache
    await CacheManager.invalidateUserCache(userId); // Esto invalida TODO el cache del usuario
    await CacheManager.invalidateRouteCache(userId, id);

    // Obtener la ruta actualizada
    const updatedRoute = await pool.query(
      `SELECT 
        r.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rw.id,
              'name', rw.name,
              'description', rw.description,
              'address', rw.address,
              'latitude', rw.latitude,
              'longitude', rw.longitude,
              'order_index', rw.order_index,
              'estimated_duration', rw.estimated_duration,
              'waypoint_type', rw.waypoint_type,
              'created_at', rw.created_at,
              'updated_at', rw.updated_at
            ) ORDER BY rw.order_index
          ) FILTER (WHERE rw.id IS NOT NULL), '[]'
        ) as waypoints
      FROM routes r
      LEFT JOIN route_waypoints rw ON r.id = rw.route_id
      WHERE r.id = $1
      GROUP BY r.id`,
      [id]
    );

    res.json({
      success: true,
      message: 'Ruta actualizada exitosamente',
      data: updatedRoute.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error actualizando ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la ruta',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  } finally {
    client.release();
  }
};

export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE routes 
       SET deleted_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
      return;
    }

    // Invalidar cache
    await CacheManager.invalidateRouteCache(userId, id);

    res.json({
      success: true,
      message: 'Ruta eliminada exitosamente'
    });

  } catch (error: any) {
    console.error('Error eliminando ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la ruta',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const getRoutesByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { day } = req.params;

    const dayOfWeek = parseInt(day);
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({
        success: false,
        error: 'El día debe ser entre 0 (Domingo) y 6 (Sábado)'
      });
      return;
    }

    const result = await pool.query(
      `SELECT 
        r.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rw.id,
              'name', rw.name,
              'description', rw.description,
              'address', rw.address,
              'latitude', rw.latitude,
              'longitude', rw.longitude,
              'order_index', rw.order_index,
              'estimated_duration', rw.estimated_duration,
              'waypoint_type', rw.waypoint_type
            ) ORDER BY rw.order_index
          ) FILTER (WHERE rw.id IS NOT NULL), '[]'
        ) as waypoints
      FROM routes r
      LEFT JOIN route_waypoints rw ON r.id = rw.route_id
      WHERE r.user_id = $1 AND r.day_of_week = $2 AND r.is_active = true AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.start_time ASC NULLS LAST, r.created_at DESC`,
      [userId, dayOfWeek]
    );

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    res.json({
      success: true,
      message: `Rutas del ${dayNames[dayOfWeek]} obtenidas exitosamente`,
      data: {
        day_of_week: dayOfWeek,
        day_name: dayNames[dayOfWeek],
        routes: result.rows
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo rutas por día:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las rutas del día',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const duplicateRoute = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { new_day_of_week, new_name } = req.body;

    await client.query('BEGIN');

    // Obtener la ruta original
    const originalRoute = await client.query(
      `SELECT * FROM routes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );

    if (originalRoute.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
      return;
    }

    const route = originalRoute.rows[0];

    // Crear la nueva ruta
    const newRouteResult = await client.query(
      `INSERT INTO routes (user_id, name, description, day_of_week, start_time, estimated_duration, total_distance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        new_name || `${route.name} (Copia)`,
        route.description,
        new_day_of_week !== undefined ? new_day_of_week : route.day_of_week,
        route.start_time,
        route.estimated_duration,
        route.total_distance
      ]
    );

    const newRoute = newRouteResult.rows[0];

    // Copiar los waypoints
    const waypoints = await client.query(
      'SELECT * FROM route_waypoints WHERE route_id = $1 ORDER BY order_index',
      [id]
    );

    for (const waypoint of waypoints.rows) {
      await client.query(
        `INSERT INTO route_waypoints 
         (route_id, name, description, address, latitude, longitude, order_index, estimated_duration, waypoint_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newRoute.id,
          waypoint.name,
          waypoint.description,
          waypoint.address,
          waypoint.latitude,
          waypoint.longitude,
          waypoint.order_index,
          waypoint.estimated_duration,
          waypoint.waypoint_type
        ]
      );
    }

    await client.query('COMMIT');

    // Invalidar cache
    await CacheManager.invalidateUserCache(userId); // Esto invalida TODO el cache del usuario
    await CacheManager.invalidateRouteCache(userId);

    res.status(201).json({
      success: true,
      message: 'Ruta duplicada exitosamente',
      data: newRoute
    });

    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error duplicando ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al duplicar la ruta',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  } finally {
    client.release();
  }
};