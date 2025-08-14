import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redis from '../config/redis';
import { JWTPayload, UserPublic } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: UserPublic;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Token de acceso requerido' 
      });
      return;
    }

    // Verificar token JWT con el secret correcto
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024'
    ) as JWTPayload;

    // Verificar si la sesión existe en Redis
    const sessionData = await redis.get(`session:${decoded.id}`);
    if (!sessionData) {
      res.status(401).json({ 
        success: false, 
        error: 'Sesión expirada' 
      });
      return;
    }

    // Buscar usuario en la base de datos
    const userResult = await pool.query(
      'SELECT id, email, full_name, phone, is_active, email_verified, last_login, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
      return;
    }

    const user = userResult.rows[0] as UserPublic;

    if (!user.is_active) {
      res.status(401).json({ 
        success: false, 
        error: 'Usuario inactivo' 
      });
      return;
    }

    // Agregar usuario al request
    req.user = user;

    // Extender sesión en Redis (renovar TTL)
    await redis.expire(`session:${user.id}`, 60 * 60 * 24 * 7); // 7 días

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
      return;
    }

    console.error('Error en autenticación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024'
    ) as JWTPayload;
    
    const userResult = await pool.query(
      'SELECT id, email, full_name, phone, is_active, email_verified, last_login, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0] as UserPublic;
    }

    next();
  } catch (error) {
    // En auth opcional, ignoramos errores y continuamos
    next();
  }
};

export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.email_verified) {
    res.status(403).json({ 
      success: false, 
      error: 'Email no verificado' 
    });
    return;
  }

  next();
};