import express from 'express';
import {
    createRoute,
    deleteRoute,
    duplicateRoute,
    getRouteById,
    getRoutesByDay,
    getUserRoutes,
    updateRoute
} from '../controllers/routes.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { cacheUserRoutes, invalidateCache } from '../middlewares/cache.middleware';
import { validateCreateRoute, validatePagination } from '../middlewares/validation.middleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route   POST /api/routes
 * @desc    Crear nueva ruta
 * @access  Private
 */
router.post('/', 
  validateCreateRoute,
  invalidateCache('routes'),
  createRoute
);

/**
 * @route   GET /api/routes
 * @desc    Obtener rutas del usuario con paginación y filtros
 * @access  Private
 */
router.get('/',
  validatePagination,
  cacheUserRoutes,
  getUserRoutes
);

/**
 * @route   GET /api/routes/day/:day
 * @desc    Obtener rutas por día de la semana (0-6)
 * @access  Private
 */
router.get('/day/:day',
  cacheUserRoutes,
  getRoutesByDay
);

/**
 * @route   GET /api/routes/:id
 * @desc    Obtener ruta específica por ID
 * @access  Private
 */
router.get('/:id',
  cacheUserRoutes,
  getRouteById
);

/**
 * @route   PUT /api/routes/:id
 * @desc    Actualizar ruta existente
 * @access  Private
 */
router.put('/:id',
  invalidateCache('routes'),
  updateRoute
);

/**
 * @route   DELETE /api/routes/:id
 * @desc    Eliminar ruta (soft delete)
 * @access  Private
 */
router.delete('/:id',
  invalidateCache('routes'),
  deleteRoute
);

/**
 * @route   POST /api/routes/:id/duplicate
 * @desc    Duplicar ruta existente
 * @access  Private
 */
router.post('/:id/duplicate',
  invalidateCache('routes'),
  duplicateRoute
);

export default router;