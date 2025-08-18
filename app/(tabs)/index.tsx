import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';

interface UserStats {
  total_routes: number;
  completed_executions: number;
  total_distance_km: number;
  routes_by_day: Record<string, number>;
}

interface TodayRoute {
  id: string;
  name: string;
  start_time?: string;
  waypoints: any[];
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme(); // Agregar hook de tema
  const [userName, setUserName] = useState<string>('Usuario');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayRoutes, setTodayRoutes] = useState<TodayRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserData();
    loadTodayRoutes();
    
    // Actualizar hora cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    try {
      // Cargar nombre del usuario del almacenamiento local
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }

      // Cargar estadísticas desde el servidor
      const statsResponse = await api.get('/user/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch {
      console.log('Error cargando datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayRoutes = async () => {
    try {
      const today = new Date().getDay(); // 0 = domingo, 1 = lunes, etc.
      const response = await api.get(`/routes/day/${today}`);
      
      if (response.data.success) {
        setTodayRoutes(response.data.data.routes || []);
      }
    } catch {
      console.log('Error cargando rutas de hoy');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Buenos días';
    if (hour < 18) return '☀️ Buenas tardes';
    return '🌙 Buenas noches';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "¡Hoy es un buen día para nuevas rutas! 🚀",
      "Cada kilómetro cuenta hacia tu objetivo 💪",
      "La aventura te espera en cada ruta 🗺️",
      "¡Mantén el rumbo y sigue adelante! ⭐",
      "Cada ruta es una nueva oportunidad 🌟"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return currentTime.toLocaleDateString('es-ES', options);
  };

  const getDayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[currentTime.getDay()];
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_route':
        router.push('/(tabs)/map');
        break;
      case 'view_routes':
        router.push('/(tabs)/routes');
        break;
      case 'view_profile':
        router.push('/(tabs)/profile');
        break;
      default:
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="refresh" size={40} color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando tu día...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header con saludo personalizado */}
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        {/* Agregar botón de tema en la esquina */}
        <View style={styles.headerTop}>
          <View style={styles.headerTopSpacer} />
          <ThemeToggle size="medium" />
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{userName}!</Text>
          <Text style={styles.dateText}>{getCurrentDate()}</Text>
          <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
        </View>

        <View style={styles.weatherWidget}>
          <Text style={styles.dayName}>{getDayName()}</Text>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Resumen</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="map" size={28} color={colors.tint} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total_routes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rutas Total</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.completed_executions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="speedometer" size={28} color={colors.danger} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total_distance_km.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Km Recorridos</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rutas de hoy */}
      <View style={styles.todaySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🗓️ Rutas de Hoy ({getDayName()})</Text>
        
        {todayRoutes.length > 0 ? (
          <View style={styles.routesList}>
            {todayRoutes.map((route) => (
              <View key={route.id} style={[styles.routeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
                <View style={styles.routeHeader}>
                  <Ionicons name="navigate-circle" size={24} color={colors.tint} />
                  <View style={styles.routeInfo}>
                    <Text style={[styles.routeName, { color: colors.text }]}>{route.name}</Text>
                    <Text style={[styles.routeTime, { color: colors.textSecondary }]}>
                      {route.start_time ? formatTime(route.start_time) : 'Sin hora definida'}
                    </Text>
                  </View>
                  <Text style={[styles.waypointCount, { color: colors.tint }]}>
                    {route.waypoints.length} paradas
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.noRoutesCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.noRoutesText, { color: colors.text }]}>No tienes rutas programadas para hoy</Text>
            <Text style={[styles.noRoutesSubtext, { color: colors.textSecondary }]}>¡Es un buen momento para crear una nueva ruta!</Text>
          </View>
        )}
      </View>

      {/* Acciones rápidas */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.tint }]}
            onPress={() => handleQuickAction('create_route')}
          >
            <Ionicons name="add-circle" size={32} color="white" />
            <Text style={styles.actionText}>Crear Ruta</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.success }]}
            onPress={() => handleQuickAction('view_routes')}
          >
            <Ionicons name="list" size={32} color="white" />
            <Text style={styles.actionText}>Ver Rutas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.warning }]}
            onPress={() => handleQuickAction('view_profile')}
          >
            <Ionicons name="person" size={32} color="white" />
            <Text style={styles.actionText}>Mi Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#9b59b6' }]}
            onPress={() => Alert.alert('Próximamente', 'Estadísticas detalladas')}
          >
            <Ionicons name="analytics" size={32} color="white" />
            <Text style={styles.actionText}>Estadísticas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Consejos del día */}
      <View style={styles.tipsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Consejo del Día</Text>
        <View style={[styles.tipCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Ionicons name="bulb" size={24} color={colors.warning} />
          <View style={styles.tipContent}>
            <Text style={[styles.tipText, { color: colors.text }]}>
              Planifica tus rutas la noche anterior para optimizar tu tiempo y combustible.
            </Text>
          </View>
        </View>
      </View>

      {/* Espacio inferior */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTopSpacer: {
    flex: 1,
  },
  greetingSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  motivationalText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
  },
  weatherWidget: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  currentTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  todaySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  routesList: {
    gap: 10,
  },
  routeCard: {
    borderRadius: 12,
    padding: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeTime: {
    fontSize: 14,
    marginTop: 2,
  },
  waypointCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  noRoutesCard: {
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noRoutesText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  noRoutesSubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  tipsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 15,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});