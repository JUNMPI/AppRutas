import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redis from '../config/redis';

export const register = async (req: any, res: any) => {
  const { email, password, fullName, full_name, phone } = req.body;
  
  // Compatibilidad con ambos nombres de campo
  const userFullName = fullName || full_name;
  
  // Log para debugging
  console.log('📝 Intentando registrar usuario:', { 
    email, 
    hasPassword: !!password, 
    fullName: userFullName,
    phone 
  });

  try {
    // Validaciones mejoradas
    if (!email || !password || !userFullName) {
      console.log('❌ Campos requeridos faltantes');
      return res.status(400).json({ 
        success: false,
        error: 'Email, contraseña y nombre completo son requeridos' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email inválido:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Por favor ingresa un email válido' 
      });
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      console.log('❌ Contraseña muy corta');
      return res.status(400).json({ 
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }

    // Validar nombre
    if (userFullName.trim().length < 2) {
      console.log('❌ Nombre muy corto');
      return res.status(400).json({ 
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres' 
      });
    }

    // Normalizar email a minúsculas
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario existe
    console.log('🔍 Verificando si el email existe:', normalizedEmail);
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userExists.rows.length > 0) {
      console.log('❌ Email ya registrado:', normalizedEmail);
      return res.status(400).json({ 
        success: false,
        error: 'El email ya está registrado' 
      });
    }

    // Hashear password
    console.log('🔐 Hasheando contraseña...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario con valores por defecto mejorados
    console.log('💾 Creando usuario en la base de datos...');
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, full_name, phone, is_active, email_verified, created_at`,
      [
        normalizedEmail, 
        passwordHash, 
        userFullName.trim(), 
        phone?.trim() || null,
        true,  // Usuario activo por defecto
        false  // Email no verificado por defecto
      ]
    );

    const user = newUser.rows[0];
    console.log('✅ Usuario creado exitosamente:', user.id);

    // Crear token con expiración fija
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024',
      { expiresIn: '7d' } // 7 días
    );

    // Guardar sesión en Redis (si está disponible)
    try {
      await redis.setex(
        `session:${user.id}`,
        60 * 60 * 24 * 7, // 7 días
        JSON.stringify({
          userId: user.id,
          email: user.email,
          fullName: user.full_name,
          token
        })
      );
      console.log('✅ Sesión guardada en Redis');
    } catch (redisError) {
      console.log('⚠️ Redis no disponible, continuando sin cache');
    }

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone
        },
        token
      }
    });

  } catch (error: any) {
    console.error('❌ Error en registro:', error);
    console.error('Detalles del error:', error.message);
    
    // Manejar error de email duplicado de PostgreSQL
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false,
        error: 'El email ya está registrado' 
      });
    }
    
    // Error genérico
    res.status(500).json({ 
      success: false,
      error: 'Error al crear usuario. Por favor intenta de nuevo.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  
  console.log('🔑 Intento de login para:', email);

  try {
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado:', normalizedEmail);
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      console.log('❌ Usuario inactivo:', normalizedEmail);
      return res.status(401).json({ 
        success: false,
        error: 'Tu cuenta está desactivada. Contacta al soporte.' 
      });
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ Contraseña incorrecta para:', normalizedEmail);
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

    console.log('✅ Login exitoso para:', user.email);

    // Crear token con expiración fija
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'mi_super_secreto_jwt_2024',
      { expiresIn: '7d' } // 7 días
    );

    // Guardar sesión en Redis (si está disponible)
    try {
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
    } catch (redisError) {
      console.log('⚠️ Redis no disponible');
    }

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone
        },
        token
      }
    });

  } catch (error: any) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión. Por favor intenta de nuevo.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logout = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      // Eliminar sesión de Redis (si está disponible)
      try {
        await redis.del(`session:${userId}`);
        console.log('✅ Sesión eliminada de Redis para usuario:', userId);
      } catch (redisError) {
        console.log('⚠️ Redis no disponible');
      }
    }
    
    res.json({ 
      success: true,
      message: 'Sesión cerrada exitosamente' 
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al cerrar sesión' 
    });
  }
};