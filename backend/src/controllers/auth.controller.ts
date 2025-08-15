import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redis from '../config/redis';

export const register = async (req: any, res: any) => {
  const { email, password, fullName, phone } = req.body;

  try {
    // Verificar si el usuario existe
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'El email ya está registrado' 
      });
    }

    // Hashear password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name`,
      [email, passwordHash, fullName, phone || null]
    );

    const user = newUser.rows[0];

    // Crear token con expiración fija
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024',
      { expiresIn: '7d' } // 7 días
    );

    // Guardar sesión en Redis (si está disponible)
    await redis.setex(
      `session:${user.id}`,
      60 * 60 * 24 * 7, // 7 días
      JSON.stringify({
        userId: user.id,
        email: user.email,
        token
      })
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear usuario' 
    });
  }
};

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const user = result.rows[0];

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    // Actualizar último login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Crear token con expiración fija
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024',
      { expiresIn: '7d' } // 7 días
    );

    // Guardar sesión en Redis (si está disponible)
    await redis.setex(
      `session:${user.id}`,
      60 * 60 * 24 * 7,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        token
      })
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión' 
    });
  }
};

export const logout = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    // Eliminar sesión de Redis (si está disponible)
    await redis.del(`session:${userId}`);
    
    res.json({ 
      success: true,
      message: 'Sesión cerrada exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error al cerrar sesión' 
    });
  }
};