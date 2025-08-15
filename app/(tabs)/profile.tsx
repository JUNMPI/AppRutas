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
import api from '../../services/api';

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
    loadUserProfile();
    loadUserStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await api.get('/user/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
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
              await api.post('/auth/logout');
              await AsyncStorage.clear();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción es irreversible. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirmar con Contraseña',
              'Ingresa tu contraseña para confirmar:',
              async (password) => {
                if (password) {
                  try {
                    await api.delete('/user/account', {
                      data: { password }
                    });
                    await AsyncStorage.clear();
                    router.replace('/(auth)/login');
                  } catch (error) {
                    Alert.alert('Error', 'No se pudo eliminar la cuenta');
                  }
                }
              },
              'secure-text'
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>No se pudo cargar el perfil</Text>
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
        <TouchableOpacity style={styles.actionButton} onPress={() => {
          Alert.alert('Info', 'Función de editar perfil próximamente');
        }}>
          <Ionicons name="create" size={20} color="#3498db" />
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => {
          Alert.alert('Info', 'Función de cambiar contraseña próximamente');
        }}>
          <Ionicons name="key" size={20} color="#f39c12" />
          <Text style={styles.actionButtonText}>Cambiar Contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => {
          Alert.alert('Info', 'Función de configuración próximamente');
        }}>
          <Ionicons name="settings" size={20} color="#9b59b6" />
          <Text style={styles.actionButtonText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#e74c3c" />
          <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash" size={20} color="#c0392b" />
          <Text style={[styles.actionButtonText, { color: '#c0392b' }]}>
            Eliminar Cuenta
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
  deleteButton: {
    borderWidth: 1,
    borderColor: '#c0392b',
    backgroundColor: '#fff2f2',
  },
});