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
      console.error('Error cargando datos:', error);
      
      if (error.message.includes('401')) {
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
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Si no hay usuario autenticado
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#bdc3c7" />
          <Text style={styles.notAuthenticatedTitle}>No hay sesión activa</Text>
          <Text style={styles.notAuthenticatedText}>
            Por favor inicia sesión para ver tu perfil
          </Text>
          
          <TouchableOpacity 
            style={styles.loginButton}
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
    <ScrollView style={styles.container}>
      {/* Header del Perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
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
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="map" size={24} color="#3498db" />
              <Text style={styles.statNumber}>{stats.total_routes}</Text>
              <Text style={styles.statLabel}>Rutas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
              <Text style={styles.statNumber}>{stats.completed_executions}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="navigate" size={24} color="#e74c3c" />
              <Text style={styles.statNumber}>{stats.total_distance_km.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Km Total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Información del Perfil */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="person" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nombre Completo</Text>
            <Text style={styles.infoValue}>{user.full_name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {user.phone && (
          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Estado de Email</Text>
            <Text style={[
              styles.infoValue,
              { color: user.email_verified ? '#27ae60' : '#f39c12' }
            ]}>
              {user.email_verified ? 'Verificado' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {user.last_login && (
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Último Acceso</Text>
              <Text style={styles.infoValue}>
                {new Date(user.last_login).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Miembro Desde</Text>
            <Text style={styles.infoValue}>
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#e74c3c" />
          <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#3498db',
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
    backgroundColor: '#3498db',
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
    backgroundColor: '#2980b9',
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
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    color: '#2c3e50',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    marginTop: 2,
  },
  actionsSection: {
    margin: 15,
    marginTop: 0,
  },
  actionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
});