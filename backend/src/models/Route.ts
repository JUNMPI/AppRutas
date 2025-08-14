import pool from '../config/database';
import { Route, RouteQuery, RouteWithWaypoints } from '../types';

export class RouteModel {
  /**
   * Crear una nueva ruta
   */
  static async create(routeData: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Route> {
    const result = await pool.query(
      `INSERT INTO routes (user_id, name, description, day_of_week, start_time, estimated_duration, is_active, total_distance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        routeData.user_id,
        routeData.name,
        routeData.description || null,
        routeData.day_of_week,
        routeData.start_time || null,
        routeData.estimated_duration || null,
        routeData.is_active,
        routeData.total_distance || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Buscar ruta por ID con waypoints
   */
  static async findByIdWithWaypoints(id: string, userId: string): Promise<RouteWithWaypoints | null> {
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
    return result.rows[0] || null;
  }

  /**
   * Obtener rutas del usuario con filtros y paginación
   */
  static async getUserRoutes(userId: string, query: RouteQuery): Promise<{
    routes: RouteWithWaypoints[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      day_of_week,
      is_active,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = query;

    const offset = (Number(page) - 1) * Number(limit);

    // Construir condiciones WHERE
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

    // Query para obtener rutas con waypoints
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
      ORDER BY r.${sort} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM routes r
      WHERE ${whereClause}
    `;

    const routesParams = [...queryParams, Number(limit), offset];
    const countParams = queryParams;

    const [routesResult, countResult] = await Promise.all([
      pool.query(routesQuery, routesParams),
      pool.query(countQuery, countParams)
    ]);

    return {
      routes: routesResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Obtener rutas por día de la semana
   */
  static async getRoutesByDay(userId: string, dayOfWeek: number): Promise<RouteWithWaypoints[]> {
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
    return result.rows;
  }

  /**
   * Actualizar ruta
   */
  static async update(id: string, userId: string, updateData: Partial<Route>): Promise<Route | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, userId);

    const query = `
      UPDATE routes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete de ruta
   */
  static async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE routes 
       SET deleted_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Duplicar ruta
   */
  static async duplicate(
    originalId: string, 
    userId: string, 
    newName?: string, 
    newDayOfWeek?: number
  ): Promise<RouteWithWaypoints | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Obtener ruta original
      const originalRoute = await client.query(
        'SELECT * FROM routes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [originalId, userId]
      );

      if (originalRoute.rows.length === 0) {
        throw new Error('Ruta no encontrada');
      }

      const route = originalRoute.rows[0];

      // Crear nueva ruta
      const newRouteResult = await client.query(
        `INSERT INTO routes (user_id, name, description, day_of_week, start_time, estimated_duration, total_distance)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          newName || `${route.name} (Copia)`,
          route.description,
          newDayOfWeek !== undefined ? newDayOfWeek : route.day_of_week,
          route.start_time,
          route.estimated_duration,
          route.total_distance
        ]
      );

      const newRoute = newRouteResult.rows[0];

      // Copiar waypoints
      const waypoints = await client.query(
        'SELECT * FROM route_waypoints WHERE route_id = $1 ORDER BY order_index',
        [originalId]
      );

      const newWaypoints = [];
      for (const waypoint of waypoints.rows) {
        const newWaypointResult = await client.query(
          `INSERT INTO route_waypoints 
           (route_id, name, description, address, latitude, longitude, order_index, estimated_duration, waypoint_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
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
        newWaypoints.push(newWaypointResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...newRoute,
        waypoints: newWaypoints
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si el usuario es propietario de la ruta
   */
  static async isOwner(routeId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM routes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [routeId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Obtener estadísticas de rutas del usuario
   */
  static async getUserRoutesStats(userId: string): Promise<{
    totalRoutes: number;
    activeRoutes: number;
    routesByDay: Record<string, number>;
    totalDistance: number;
  }> {
    const [totalResult, routesByDayResult, distanceResult] = await Promise.all([
      // Total de rutas y activas
      pool.query(
        `SELECT 
          COUNT(*) as total_routes,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_routes
         FROM routes 
         WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      ),
      // Rutas por día
      pool.query(
        `SELECT day_of_week, COUNT(*) as count 
         FROM routes 
         WHERE user_id = $1 AND is_active = true AND deleted_at IS NULL 
         GROUP BY day_of_week 
         ORDER BY day_of_week`,
        [userId]
      ),
      // Distancia total
      pool.query(
        `SELECT COALESCE(SUM(total_distance), 0) as total_distance
         FROM routes 
         WHERE user_id = $1 AND is_active = true AND deleted_at IS NULL`,
        [userId]
      )
    ]);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const routesByDay: Record<string, number> = {};
    
    routesByDayResult.rows.forEach(row => {
      routesByDay[dayNames[row.day_of_week]] = parseInt(row.count);
    });

    return {
      totalRoutes: parseInt(totalResult.rows[0].total_routes),
      activeRoutes: parseInt(totalResult.rows[0].active_routes),
      routesByDay,
      totalDistance: parseFloat(distanceResult.rows[0].total_distance)
    };
  }
}