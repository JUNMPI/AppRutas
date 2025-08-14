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

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
}

export interface Route {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  day_of_week: number;
  start_time?: string;
  estimated_duration?: number;
  is_active: boolean;
  total_distance?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
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
  estimated_duration: number;
  waypoint_type: 'start' | 'stop' | 'end';
  created_at: Date;
  updated_at: Date;
}

export interface RouteWithWaypoints extends Route {
  waypoints: RouteWaypoint[];
}

export interface RouteExecution {
  id: string;
  route_id: string;
  user_id: string;
  started_at: Date;
  completed_at?: Date;
  actual_duration?: number;
  total_distance?: number;
  notes?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  route?: Route;
}

export interface CreateRouteRequest {
  name: string;
  description?: string;
  day_of_week: number;
  start_time?: string;
  waypoints: {
    name: string;
    description?: string;
    address?: string;
    latitude: number;
    longitude: number;
    order_index: number;
    estimated_duration?: number;
    waypoint_type?: 'start' | 'stop' | 'end';
  }[];
}

export interface RouteQuery {
  page?: number;
  limit?: number;
  day_of_week?: number;
  is_active?: boolean;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes', 
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
] as const;