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

const router = express.Router();

router.use(authenticateToken);

router.post('/', createRoute);
router.get('/', getUserRoutes);
router.get('/day/:day', getRoutesByDay);
router.get('/:id', getRouteById);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);
router.post('/:id/duplicate', duplicateRoute);

export default router;