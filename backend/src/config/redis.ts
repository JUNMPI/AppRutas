import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

// Crear una instancia de Redis solo si está configurado
let redis: Redis | null = null;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    lazyConnect: true // No conectar automáticamente
  });

  // Intentar conectar
  redis.connect().then(() => {
    console.log('✅ Redis conectado');
  }).catch((err) => {
    console.warn('⚠️ Redis no disponible - continuando sin cache:', err.message);
    redis = null;
  });

  redis.on('error', (err) => {
    console.warn('⚠️ Redis error - deshabilitando cache:', err.message);
    redis = null;
  });

} catch (error) {
  console.warn('⚠️ Redis no configurado - continuando sin cache');
  redis = null;
}

// Crear un wrapper que maneje cuando Redis no está disponible
export const redisWrapper = {
  async get(key: string): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch {
      return null;
    }
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, seconds, value);
    } catch {
      // Silenciosamente fallar si Redis no está disponible
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(...keys);
    } catch {
      // Silenciosamente fallar si Redis no está disponible
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    try {
      return await redis.keys(pattern);
    } catch {
      return [];
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!redis) return;
    try {
      await redis.expire(key, seconds);
    } catch {
      // Silenciosamente fallar si Redis no está disponible
    }
  },

  async flushdb(): Promise<void> {
    if (!redis) return;
    try {
      await redis.flushdb();
    } catch {
      // Silenciosamente fallar si Redis no está disponible
    }
  },

  async dbsize(): Promise<number> {
    if (!redis) return 0;
    try {
      return await redis.dbsize();
    } catch {
      return 0;
    }
  },

  async info(section?: string): Promise<string> {
    if (!redis) return '';
    try {
      if (section) {
        return await redis.info(section);
      } else {
        return await redis.info();
      }
    } catch {
      return '';
    }
  }
};

export default redisWrapper;