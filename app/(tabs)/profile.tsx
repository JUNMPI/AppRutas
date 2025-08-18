import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
}

interface UserStats {
  total_routes: number;
  completed_executions: number;
  total_distance_km: number;
  routes_by_day: Record<string, number>;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const makeAPICall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`http://192.168.100.4:5000/api${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No hay token, redirigiendo al login');
        router.replace('/(auth)/login');
        return;
      }

      console.log('Token encontrado, cargando datos del usuario...');
      
      // Cargar perfil
      try {
        const profileData = await makeAPICall('/user/profile');
        if (profileData?.success) {
          setUser(profileData.data);
          console.log('Perfil cargado:', profileData.data.full_name);
        }
      } catch (profileError) {
        console.log('Error en perfil:', profileError);
      }

      // Cargar estadísticas
      try {
        const statsData = await makeAPICall('/user/stats');
        if (statsData?.success) {
          setStats(statsData.data);
        }
      } catch (statsError) {
        console.log('Error en stats:', statsError);
      }

    } catch (error: any) {
      console.error('Error cargando datos:', error?.message || error);
      
      if (error?.message?.includes('401')) {
        console.log('Token inválido, limpiando sesión...');
        await clearSession();
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove([
        'authToken',
        'userEmail', 
        'userName'
      ]);
      console.log('Sesión limpiada');
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Intentar hacer logout en el servidor
              await makeAPICall('/auth/logout', 'POST').catch(() => {
                console.log('Logout del servidor falló, pero continuando...');
              });
              
              // Limpiar datos locales
              await clearSession();
              
              // Redirigir al login
              router.replace('/(auth)/login');
            } catch (error: any) {
              console.error('Error eliminando sesión:', error);
              // Aunque falle, limpiar sesión local
              await clearSession();
              router.replace('/(auth)/login');
            }
          }
        }
      ]
    );
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
      </View>
    );
  }

  // Si no hay usuario autenticado
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notAuthenticatedContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.notAuthenticatedTitle, { color: colors.text }]}>No hay sesión activa</Text>
          <Text style={[styles.notAuthenticatedText, { color: colors.textSecondary }]}>
            Por favor inicia sesión para ver tu perfil
          </Text>
          
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.tint }]}
            onPress={handleGoToLogin}
          >
            <Ionicons name="log-in" size={20} color="white" />
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header del Perfil */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarText}>
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      {/* Estadísticas */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="map" size={24} color={colors.tint} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total_routes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rutas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.completed_executions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="navigate" size={24} color={colors.danger} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total_distance_km.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Km Total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Información del Perfil */}
      <View style={[styles.infoSection, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información Personal</Text>
        
        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="person" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nombre Completo</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.full_name}</Text>
          </View>
        </View>

        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="mail" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
          </View>
        </View>

        {user.phone && (
          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="call" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Teléfono</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.phone}</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Estado de Email</Text>
            <Text style={[
              styles.infoValue,
              { color: user.email_verified ? colors.success : colors.warning }
            ]}>
              {user.email_verified ? 'Verificado' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {user.last_login && (
          <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Último Acceso</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(user.last_login).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.infoItem, { borderBottomColor: 'transparent' }]}>
          <Ionicons name="calendar" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Miembro Desde</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton, { backgroundColor: colors.cardBackground, borderColor: colors.danger, shadowColor: colors.shadow }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.actionButtonText, { color: colors.danger }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notAuthenticatedText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  header: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    margin: 15,
    padding: 20,
    borderRadius: 10,
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
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoSection: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 16,
    marginTop: 2,
  },
  actionsSection: {
    margin: 15,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutButton: {
    borderWidth: 1,
  },
});