import { NextFunction, Request, Response } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      error: 'Todos los campos son requeridos'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido'
    });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son requeridos'
    });
  }

  next();
};

export const validateCreateRoute = (req: Request, res: Response, next: NextFunction) => {
  const { name, day_of_week, waypoints } = req.body;

  if (!name || day_of_week === undefined || !waypoints) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, día y waypoints son requeridos'
    });
  }

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Se requieren al menos 2 waypoints'
    });
  }

  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page && isNaN(Number(page))) {
    return res.status(400).json({
      success: false,
      error: 'Página debe ser un número'
    });
  }

  if (limit && isNaN(Number(limit))) {
    return res.status(400).json({
      success: false,
      error: 'Límite debe ser un número'
    });
  }

  next();
};