import express from 'express';
import {
    changePassword,
    deleteUserAccount,
    getUserProfile,
    getUserStats,
    updateUserProfile
} from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheRouteStats, cacheUserProfile, invalidateCache } from '../middlewares/cache.middleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Obtener perfil del usuario
 * @access  Private
 */
router.get('/profile',
  cacheUserProfile,
  getUserProfile
);

/**
 * @route   PUT /api/user/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/profile',
  invalidateCache('user_profile'),
  updateUserProfile
);

/**
 * @route   PUT /api/user/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put('/change-password',
  changePassword
);

/**
 * @route   GET /api/user/stats
 * @desc    Obtener estadísticas del usuario
 * @access  Private
 */
router.get('/stats',
  cacheRouteStats,
  getUserStats
);

/**
 * @route   DELETE /api/user/account
 * @desc    Eliminar cuenta del usuario
 * @access  Private
 */
router.delete('/account',
  deleteUserAccount
);

export default router;