import { NextFunction, Request, Response } from 'express';
import redis from '../config/redis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  condition?: (req: Request) => boolean;
}

export const createCacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutos por defecto
    keyPrefix = 'cache',
    condition = () => true
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Verificar condición personalizada
    if (!condition(req)) {
      next();
      return;
    }

    try {
      // Crear clave de cache única
      const userId = req.user?.id || 'anonymous';
      const cacheKey = `${keyPrefix}:${userId}:${req.originalUrl}`;

      // Buscar en cache
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        // Cache hit - devolver datos cacheados
        const parsedData = JSON.parse(cachedData);
        res.json({
          ...parsedData,
          _cached: true,
          _cacheKey: cacheKey
        });
        return;
      }

      // Cache miss - continuar con el request normal
      // Modificar res.json para guardar en cache
      const originalJson = res.json.bind(res);
      
      res.json = function(data: any) {
        // Solo cachear respuestas exitosas
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Guardar en cache de forma asíncrona
          redis.setex(cacheKey, ttl, JSON.stringify(data))
            .catch(error => {
              console.error('Error guardando en cache:', error);
            });
        }
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Error en cache middleware:', error);
      // En caso de error, continuar sin cache
      next();
    }
  };
};

// Middleware para invalidar cache específico
export const invalidateCache = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (userId) {
        const keys = await redis.keys(`*${userId}*${pattern}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`Cache invalidado: ${keys.length} claves eliminadas`);
        }
      }
    } catch (error) {
      console.error('Error invalidando cache:', error);
    }
    next();
  };
};

// Middleware específicos para diferentes endpoints
export const cacheUserRoutes = createCacheMiddleware({
  ttl: 600, // 10 minutos
  keyPrefix: 'user_routes',
  condition: (req) => !req.query.search // No cachear búsquedas
});

export const cacheUserProfile = createCacheMiddleware({
  ttl: 1800, // 30 minutos
  keyPrefix: 'user_profile'
});

export const cacheRouteStats = createCacheMiddleware({
  ttl: 3600, // 1 hora
  keyPrefix: 'route_stats'
});

// Utilidades para invalidación manual
export class CacheManager {
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      const keys = await redis.keys(`*${userId}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache de usuario ${userId} invalidado: ${keys.length} claves`);
      }
    } catch (error) {
      console.error('Error invalidando cache de usuario:', error);
    }
  }

  static async invalidateRouteCache(userId: string, routeId?: string): Promise<void> {
    try {
      const pattern = routeId 
        ? `*${userId}*routes*${routeId}*`
        : `*${userId}*routes*`;
      
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache de rutas invalidado: ${keys.length} claves`);
      }
    } catch (error) {
      console.error('Error invalidando cache de rutas:', error);
    }
  }

  static async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const info = await redis.info('memory');
      const keys = await redis.dbsize();
      
      return {
        totalKeys: keys,
        memoryUsage: info.split('\r\n')
          .find(line => line.startsWith('used_memory_human:'))
          ?.split(':')[1] || 'N/A'
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de cache:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'Error'
      };
    }
  }

  static async clearAllCache(): Promise<void> {
    try {
      await redis.flushdb();
      console.log('Cache completamente limpiado');
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }
}