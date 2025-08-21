import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import pool from '../config/database';
import { CacheManager } from '../middlewares/cache.middleware';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT 
        id, email, full_name, phone, is_active, email_verified, last_login, created_at
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el perfil'
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { full_name, phone } = req.body;

    // Validaciones
    if (full_name && full_name.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      });
      return;
    }

    if (phone && phone.length > 20) {
      res.status(400).json({
        success: false,
        error: 'El teléfono no puede tener más de 20 caracteres'
      });
      return;
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex}`);
      updateValues.push(full_name.trim());
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      updateValues.push(phone.trim() || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
      return;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, email, full_name, phone, is_active, email_verified, last_login, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    // Invalidar cache del usuario
    await CacheManager.invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el perfil'
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({
        success: false,
        error: 'La contraseña actual y nueva son requeridas'
      });
      return;
    }

    // Validar nueva contraseña
    if (new_password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
      return;
    }

    // Obtener usuario con contraseña hasheada
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      res.status(400).json({
        success: false,
        error: 'La contraseña actual es incorrecta'
      });
      return;
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Actualizar contraseña
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidar cache del usuario
    await CacheManager.invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar la contraseña'
    });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Obtener todas las estadísticas necesarias
    const [routesResult, executionsResult, distanceResult, routesByDayResult] = await Promise.all([
      // Total de rutas del usuario
      pool.query(
        'SELECT COUNT(*) as total FROM routes WHERE user_id = $1 AND deleted_at IS NULL',
        [userId]
      ),
      // Total de ejecuciones completadas (por ahora usamos rutas activas como proxy)
      pool.query(
        `SELECT COUNT(*) as total 
         FROM routes 
         WHERE user_id = $1 
         AND is_active = true 
         AND deleted_at IS NULL`,
        [userId]
      ),
      // Suma total de kilómetros de TODAS las rutas (no solo activas)
      pool.query(
        `SELECT COALESCE(SUM(total_distance), 0) as total
         FROM routes 
         WHERE user_id = $1 
         AND deleted_at IS NULL`,
        [userId]
      ),
      // Rutas agrupadas por día
      pool.query(
        `SELECT day_of_week, COUNT(*) as count 
         FROM routes 
         WHERE user_id = $1 AND deleted_at IS NULL 
         GROUP BY day_of_week 
         ORDER BY day_of_week`,
        [userId]
      )
    ]);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const routes_by_day: Record<string, number> = {};
    routesByDayResult.rows.forEach((row: any) => {
      const dayName = dayNames[row.day_of_week];
      if (dayName) {
        routes_by_day[dayName] = parseInt(row.count);
      }
    });

    const stats = {
      total_routes: parseInt(routesResult.rows[0].total),
      completed_executions: parseInt(executionsResult.rows[0].total), // Por ahora es el mismo que rutas activas
      total_distance_km: parseFloat(distanceResult.rows[0].total) || 0,
      routes_by_day
    };

    console.log('Estadísticas del usuario:', stats); // Para debug

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas'
    });
  }
};

export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        error: 'Contraseña requerida para eliminar la cuenta'
      });
      return;
    }

    // Verificar contraseña
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      res.status(400).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
      return;
    }

    // Soft delete del usuario
    await pool.query(
      'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1',
      [userId]
    );

    // Invalidar cache del usuario
    await CacheManager.invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la cuenta'
    });
  }
};