-- Script de inicialización para apprutas SIN PostGIS
-- Este script funcionará directamente en PostgreSQL sin extensiones adicionales

-- Crear extensión para UUID (esta sí viene con PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
    start_time TIME,
    estimated_duration INTEGER, -- en minutos
    is_active BOOLEAN DEFAULT true,
    total_distance DECIMAL(10,2), -- en kilómetros
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de puntos de ruta (waypoints)
CREATE TABLE IF NOT EXISTS route_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER DEFAULT 0, -- tiempo estimado en este punto (minutos)
    waypoint_type VARCHAR(50) DEFAULT 'stop', -- 'start', 'stop', 'end'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de rutas ejecutadas
CREATE TABLE IF NOT EXISTS route_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_duration INTEGER, -- duración real en minutos
    total_distance DECIMAL(10,2),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_routes_user_day ON routes(user_id, day_of_week) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_order ON route_waypoints(route_id, order_index);
CREATE INDEX IF NOT EXISTS idx_route_executions_user_date ON route_executions(user_id, started_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_waypoints_updated_at BEFORE UPDATE ON route_waypoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo con contraseña hasheada correcta
-- La contraseña es: demo123
INSERT INTO users (email, password_hash, full_name, phone) VALUES 
('demo@apprutas.com', '$2b$10$YourHashHere123456789012345678901234567890123456', 'Usuario Demo', '999999999'),
('admin@apprutas.com', '$2b$10$YourHashHere123456789012345678901234567890123456', 'Administrador', '988888888')
ON CONFLICT (email) DO NOTHING;

-- Insertar algunas rutas de ejemplo
INSERT INTO routes (user_id, name, description, day_of_week, start_time, estimated_duration, total_distance)
SELECT 
    u.id,
    'Ruta de Lunes por la mañana',
    'Ruta de reparto en la zona centro',
    1, -- Lunes
    '08:00:00',
    120, -- 2 horas
    25.5
FROM users u WHERE u.email = 'demo@apprutas.com'
ON CONFLICT DO NOTHING;

INSERT INTO routes (user_id, name, description, day_of_week, start_time, estimated_duration, total_distance)
SELECT 
    u.id,
    'Ruta de Miércoles',
    'Ruta de reparto en la zona norte',
    3, -- Miércoles
    '09:30:00',
    180, -- 3 horas
    45.2
FROM users u WHERE u.email = 'demo@apprutas.com'
ON CONFLICT DO NOTHING;

-- Insertar waypoints de ejemplo para la primera ruta
INSERT INTO route_waypoints (route_id, name, description, address, latitude, longitude, order_index, waypoint_type)
SELECT 
    r.id,
    'Punto de inicio - Almacén',
    'Salida del almacén central',
    'Av. Principal 123, Chiclayo',
    -6.7701,
    -79.8405,
    0,
    'start'
FROM routes r 
WHERE r.name = 'Ruta de Lunes por la mañana'
ON CONFLICT DO NOTHING;

INSERT INTO route_waypoints (route_id, name, description, address, latitude, longitude, order_index, waypoint_type)
SELECT 
    r.id,
    'Cliente 1 - Tienda San José',
    'Primera parada',
    'Jr. San José 456, Chiclayo',
    -6.7720,
    -79.8420,
    1,
    'stop'
FROM routes r 
WHERE r.name = 'Ruta de Lunes por la mañana'
ON CONFLICT DO NOTHING;

INSERT INTO route_waypoints (route_id, name, description, address, latitude, longitude, order_index, waypoint_type)
SELECT 
    r.id,
    'Cliente 2 - Bodega María',
    'Segunda parada',
    'Av. Balta 789, Chiclayo',
    -6.7735,
    -79.8435,
    2,
    'stop'
FROM routes r 
WHERE r.name = 'Ruta de Lunes por la mañana'
ON CONFLICT DO NOTHING;

INSERT INTO route_waypoints (route_id, name, description, address, latitude, longitude, order_index, waypoint_type)
SELECT 
    r.id,
    'Punto final - Almacén',
    'Regreso al almacén',
    'Av. Principal 123, Chiclayo',
    -6.7701,
    -79.8405,
    3,
    'end'
FROM routes r 
WHERE r.name = 'Ruta de Lunes por la mañana'
ON CONFLICT DO NOTHING;

-- Verificar que todo se creó correctamente
SELECT 
    'Tablas creadas exitosamente' as mensaje,
    (SELECT COUNT(*) FROM users) as total_usuarios,
    (SELECT COUNT(*) FROM routes) as total_rutas,
    (SELECT COUNT(*) FROM route_waypoints) as total_waypoints;