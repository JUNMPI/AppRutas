import pool from '../config/database';
import { User, UserPublic } from '../types';

export class UserModel {
  /**
   * Crear un nuevo usuario
   */
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        userData.password_hash,
        userData.full_name,
        userData.phone || null,
        userData.is_active,
        userData.email_verified
      ]
    );
    return result.rows[0];
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Obtener versión pública del usuario (sin password_hash)
   */
  static async findByIdPublic(id: string): Promise<UserPublic | null> {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, is_active, email_verified, last_login, created_at
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Actualizar usuario
   */
  static async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Actualizar último login
   */
  static async updateLastLogin(id: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  }

  /**
   * Soft delete del usuario
   */
  static async softDelete(id: string): Promise<boolean> {
    const result = await pool.query(
      'UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Verificar si el email existe
   */
  static async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL';
    const values = [email];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Obtener estadísticas del usuario
   */
  static async getUserStats(userId: string): Promise<{
    totalRoutes: number;
    activeRoutes: number;
    completedExecutions: number;
    totalDistanceKm: number;
  }> {
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT r.id) as total_routes,
        COUNT(DISTINCT CASE WHEN r.is_active = true THEN r.id END) as active_routes,
        COUNT(DISTINCT CASE WHEN re.status = 'completed' THEN re.id END) as completed_executions,
        COALESCE(SUM(DISTINCT re.total_distance), 0) as total_distance_km
       FROM users u
       LEFT JOIN routes r ON u.id = r.user_id AND r.deleted_at IS NULL
       LEFT JOIN route_executions re ON u.id = re.user_id AND re.status = 'completed'
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    const stats = result.rows[0] || {
      total_routes: 0,
      active_routes: 0,
      completed_executions: 0,
      total_distance_km: 0
    };

    return {
      totalRoutes: parseInt(stats.total_routes),
      activeRoutes: parseInt(stats.active_routes),
      completedExecutions: parseInt(stats.completed_executions),
      totalDistanceKm: parseFloat(stats.total_distance_km)
    };
  }

  /**
   * Obtener usuarios activos (para admin)
   */
  static async getActiveUsers(limit: number = 50, offset: number = 0): Promise<UserPublic[]> {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, is_active, email_verified, last_login, created_at
       FROM users 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Contar usuarios totales
   */
  static async countUsers(): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    );
    return parseInt(result.rows[0].count);
  }
}