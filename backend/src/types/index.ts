// types/index.ts - Tipos actualizados para coincidir con tu esquema de BD

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Route {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  day_of_week: number; // 0=Domingo, 6=Sábado
  start_time?: string; // TIME format
  estimated_duration?: number; // en minutos
  is_active: boolean;
  total_distance?: number; // en kilómetros
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  waypoints?: RouteWaypoint[]; // Para incluir los puntos cuando se necesiten
  user?: User; // Para incluir info del usuario cuando se necesite
}

export interface RouteWaypoint {
  id: string;
  route_id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  order_index: number;
  estimated_duration: number; // tiempo en este punto (minutos)
  waypoint_type: 'start' | 'stop' | 'end';
  created_at: Date;
  updated_at: Date;
}

export interface RouteExecution {
  id: string;
  route_id: string;
  user_id: string;
  started_at: Date;
  completed_at?: Date;
  actual_duration?: number; // duración real en minutos
  total_distance?: number;
  notes?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  route?: Route; // Para incluir info de la ruta cuando se necesite
}

// Tipos para formularios y requests
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface CreateRouteData {
  name: string;
  description?: string;
  day_of_week: number;
  start_time?: string;
  estimated_duration?: number;
  waypoints: Omit<RouteWaypoint, 'id' | 'route_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateRouteData {
  name?: string;
  description?: string;
  day_of_week?: number;
  start_time?: string;
  estimated_duration?: number;
  is_active?: boolean;
  waypoints?: Omit<RouteWaypoint, 'id' | 'route_id' | 'created_at' | 'updated_at'>[];
}

// Helpers para días de la semana
export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes', 
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
] as const;

export const getDayName = (dayNumber: number): string => {
  return DAYS_OF_WEEK[dayNumber] || 'Día desconocido';
};