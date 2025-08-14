import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Configuraciones
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        api.get('/user/profile'),
        api.get('/user/stats')
      ]);

      if (profileResponse.data.success) {
        setUser(profileResponse.data.data);
        setEditName(profileResponse.data.data.full_name);
        setEditPhone(profileResponse.data.data.phone || '');
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
            } catch (error) {
              console.log('Error en logout:', error);
            } finally {
              await AsyncStorage.multiRemove(['authToken', 'userEmail', 'userName']);
              router.replace('/(auth)/login');
            }
          }
        }
      ]
    );
  };

  const updateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      const response = await api.put('/user/profile', {
        full_name: editName.trim(),
        phone: editPhone.trim() || null
      });

      if (response.data.success) {
        setUser(response.data.data);
        setEditModalVisible(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await api.put('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Éxito', 'Contraseña cambiada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la contraseña');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header del perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.phone && (
          <Text style={styles.userPhone}>{user.phone}</Text>
        )}
      </View>

      {/* Estadísticas */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total_routes}</Text>
              <Text style={styles.statLabel}>Rutas Creadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completed_executions}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {stats.total_distance_km.toFixed(1)}km
              </Text>
              <Text style={styles.statLabel}>Distancia Total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Información de la cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Miembro desde:</Text>
            <Text style={styles.infoValue}>
              {user ? formatDate(user.created_at) : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Último acceso:</Text>
            <Text style={styles.infoValue}>
              {formatLastLogin(user?.last_login)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: user?.is_active ? '#27ae60' : '#e74c3c' }
              ]} />
              <Text style={styles.infoValue}>
                {user?.is_active ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Configuraciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Notificaciones</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#3498db' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={20} color="#666" />
              <Text style={styles.settingLabel}>Modo Oscuro</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#3498db' }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="person-outline" size={20} color="#3498db" />
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#f39c12" />
          <Text style={styles.actionButtonText}>Cambiar Contraseña</Text>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Info', 'Función pendiente de implementar')}
        >
          <Ionicons name="download-outline" size={20} color="#27ae60" />
          <Text style={styles.actionButtonText}>Exportar Datos</Text>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={[styles.actionButtonText, styles.logoutText]}>
            Cerrar Sesión
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </TouchableOpacity>
      </View>

      {/* Modal de editar perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ingresa tu nombre completo"
            />
            
            <Text style={styles.inputLabel}>Teléfono (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Ingresa tu número de teléfono"
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditName(user?.full_name || '');
                  setEditPhone(user?.phone || '');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateProfile}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de cambiar contraseña */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
            
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              secureTextEntry
            />
            
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Ingresa tu nueva contraseña"
              secureTextEntry
            />
            
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma tu nueva contraseña"
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={changePassword}
              >
                <Text style={styles.saveButtonText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3498db',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
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
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',