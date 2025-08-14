import { AlertCircle, Calendar, CheckCircle, Clock, LogOut, MapPin, Route, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { DAYS_OF_WEEK, RouteExecution, Route as RouteType, User } from '../types';

interface ProfileStats {
  totalRoutes: number;
  activeRoutes: number;
  completedExecutions: number;
  totalDistance: number;
  averageDuration: number;
  mostActiveDay: string;
}

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRoutes, setUserRoutes] = useState<RouteType[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<RouteExecution[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalRoutes: 0,
    activeRoutes: 0,
    completedExecutions: 0,
    totalDistance: 0,
    averageDuration: 0,
    mostActiveDay: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if viewing own profile
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnProfile = !id || id === currentUser.id;

  useEffect(() => {
    fetchUserProfile();
    fetchUserRoutes();
    fetchRecentExecutions();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userId = id || currentUser.id;
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (err) {
      setError('Error al cargar el perfil');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoutes = async () => {
    try {
      const userId = id || currentUser.id;
      const response = await api.get(`/routes/user/${userId}`);
      setUserRoutes(response.data);
      
      // Calcular estadísticas
      const routes = response.data;
      const activeRoutes = routes.filter((r: RouteType) => r.is_active);
      const totalDistance = routes.reduce((sum: number, r: RouteType) => sum + (r.total_distance || 0), 0);
      
      // Calcular día más activo
      const dayCount: Record<number, number> = {};
      routes.forEach((r: RouteType) => {
        dayCount[r.day_of_week] = (dayCount[r.day_of_week] || 0) + 1;
      });
      const mostActiveDayNum = Object.entries(dayCount).sort(([,a], [,b]) => b - a)[0]?.[0];
      
      setStats(prev => ({
        ...prev,
        totalRoutes: routes.length,
        activeRoutes: activeRoutes.length,
        totalDistance: totalDistance,
        mostActiveDay: mostActiveDayNum ? DAYS_OF_WEEK[parseInt(mostActiveDayNum)] : 'N/A'
      }));
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      const userId = id || currentUser.id;
      const response = await api.get(`/route-executions/user/${userId}`);
      setRecentExecutions(response.data);
      
      // Actualizar estadísticas con ejecuciones
      const executions = response.data;
      const completed = executions.filter((e: RouteExecution) => e.status === 'completed');
      const avgDuration = completed.length > 0 
        ? completed.reduce((sum: number, e: RouteExecution) => sum + (e.actual_duration || 0), 0) / completed.length
        : 0;
      
      setStats(prev => ({
        ...prev,
        completedExecutions: completed.length,
        averageDuration: Math.round(avgDuration)
      }));
    } catch (err) {
      console.error('Error fetching executions:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Usuario no encontrado'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
              <div className="flex items-center mt-2 space-x-4">
                <span className={`flex items-center text-sm ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {user.is_active ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Miembro desde {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <Route className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{stats.totalRoutes}</p>
          <p className="text-sm text-gray-600">Rutas Totales</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">{stats.activeRoutes}</p>
          <p className="text-sm text-gray-600">Rutas Activas</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <MapPin className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold">{stats.completedExecutions}</p>
          <p className="text-sm text-gray-600">Completadas</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <Route className="w-8 h-8 text-indigo-600 mb-2" />
          <p className="text-2xl font-bold">{stats.totalDistance.toFixed(1)}</p>
          <p className="text-sm text-gray-600">Km Totales</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <Clock className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold">{stats.averageDuration}</p>
          <p className="text-sm text-gray-600">Min Promedio</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <Calendar className="w-8 h-8 text-pink-600 mb-2" />
          <p className="text-lg font-bold">{stats.mostActiveDay}</p>
          <p className="text-sm text-gray-600">Día Más Activo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'routes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mis Rutas
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'executions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Información del Perfil</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Nombre Completo</span>
                  <span className="font-medium">{user.full_name}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Teléfono</span>
                    <span className="font-medium">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Estado de Email</span>
                  <span className={`font-medium ${user.email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user.email_verified ? 'Verificado' : 'Pendiente de verificación'}
                  </span>
                </div>
                {user.last_login && (
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Último Acceso</span>
                    <span className="font-medium">
                      {new Date(user.last_login).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Miembro Desde</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Mis Rutas</h2>
              {userRoutes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRoutes.map((route) => (
                    <div key={route.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{route.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          route.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {route.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {route.description && (
                        <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {DAYS_OF_WEEK[route.day_of_week]}
                        </span>
                        {route.start_time && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(route.start_time)}
                          </span>
                        )}
                        {route.estimated_duration && (
                          <span className="flex items-center">
                            ⏱️ {formatDuration(route.estimated_duration)}
                          </span>
                        )}
                        {route.total_distance && (
                          <span className="flex items-center">
                            📍 {route.total_distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No has creado rutas aún</p>
              )}
            </div>
          )}

          {activeTab === 'executions' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Historial de Ejecuciones</h2>
              {recentExecutions.length > 0 ? (
                <div className="space-y-4">
                  {recentExecutions.slice(0, 10).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">
                          {execution.route?.name || 'Ruta eliminada'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(execution.started_at).toLocaleString()}
                          {execution.actual_duration && ` • ${formatDuration(execution.actual_duration)}`}
                          {execution.total_distance && ` • ${execution.total_distance.toFixed(1)} km`}
                        </p>
                        {execution.notes && (
                          <p className="text-sm text-gray-500 mt-1">{execution.notes}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                        execution.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {execution.status === 'completed' ? 'Completada' :
                         execution.status === 'in_progress' ? 'En Progreso' :
                         'Cancelada'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay historial de ejecuciones</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;