import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; // ← AGREGAR ESTA LÍNEA
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';


interface Route {
  id: string;
  name: string;
  description?: string;
  day_of_week: number;
  start_time?: string;
  is_active: boolean;
  total_distance?: number;
  waypoints: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order_index: number;
    waypoint_type: string;
  }[];
  created_at: string;
}

export default function RoutesScreen() {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    loadRoutes();
  }, [selectedDay, searchText]);

  const loadRoutes = async () => {
    try {
      let url = '/routes?limit=50';
      if (selectedDay !== null) url += `&day_of_week=${selectedDay}`;
      if (searchText.trim()) url += `&search=${encodeURIComponent(searchText.trim())}`;

      const response = await api.get(url);
      
      if (response.data.success) {
        setRoutes(response.data.data.routes);
      }
    } catch {
      console.error('Error cargando rutas');
      Alert.alert('Error', 'No se pudieron cargar las rutas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const deleteRoute = async (routeId: string, routeName: string) => {
    Alert.alert(
      'Eliminar Ruta',
      `¿Estás seguro de que quieres eliminar "${routeName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/routes/${routeId}`);
              setRoutes(routes.filter(route => route.id !== routeId));
              Alert.alert('Éxito', 'Ruta eliminada correctamente');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la ruta');
            }
          }
        }
      ]
    );
  };

  const toggleRouteStatus = async (routeId: string, currentStatus: boolean) => {
    try {
      await api.put(`/routes/${routeId}`, {
        is_active: !currentStatus
      });
      
      setRoutes(routes.map(route => 
        route.id === routeId 
          ? { ...route, is_active: !currentStatus }
          : route
      ));
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado de la ruta');
    }
  };

  const duplicateRoute = async (routeId: string, routeName: string) => {
    try {
      const response = await api.post(`/routes/${routeId}/duplicate`, {
        new_name: `${routeName} (Copia)`
      });
      
      if (response.data.success) {
        Alert.alert('Éxito', 'Ruta duplicada correctamente');
        loadRoutes(); // Recargar la lista
      }
    } catch {
      Alert.alert('Error', 'No se pudo duplicar la ruta');
    }
  };

  const formatDistance = (distance?: number) => {
    // Verificación más estricta para evitar crashes
    if (distance === undefined || distance === null || isNaN(distance)) {
      return 'N/A';
    }
    
    // Convertir a número si viene como string
    const numDistance = Number(distance);
    
    if (isNaN(numDistance)) {
      return 'N/A';
    }
    
    if (numDistance === 0) {
      return '0 km';
    }
    
    return numDistance < 1 
      ? `${Math.round(numDistance * 1000)}m`
      : `${numDistance.toFixed(1)}km`;
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <View style={[styles.routeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={[styles.routeName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.routeDay, { color: colors.tint }]}>{dayNamesFull[item.day_of_week]}</Text>
          {item.description && (
            <Text style={[styles.routeDescription, { color: colors.textSecondary }]}>{item.description}</Text>
          )}
        </View>
        
        <View style={styles.routeStatus}>
          <TouchableOpacity
            style={[
              styles.statusIndicator,
              { backgroundColor: item.is_active ? colors.success : colors.danger }
            ]}
            onPress={() => toggleRouteStatus(item.id, item.is_active)}
          >
            <Text style={styles.statusText}>
              {item.is_active ? 'Activa' : 'Inactiva'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.waypoints.length} puntos
          </Text>
        </View>
        
        {item.total_distance !== undefined && item.total_distance !== null && (
          <View style={styles.detailItem}>
            <Ionicons name="map" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatDistance(item.total_distance)}
            </Text>
          </View>
        )}
        
        {item.start_time && (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.start_time}</Text>
          </View>
        )}
      </View>

      {item.waypoints.length > 0 && (
        <View style={[styles.waypointsPreview, { backgroundColor: colors.background }]}>
          <Text style={[styles.waypointsTitle, { color: colors.textSecondary }]}>Ruta:</Text>
          <Text style={[styles.waypointsText, { color: colors.text }]}>
            {item.waypoints
              .sort((a, b) => a.order_index - b.order_index)
              .map(wp => wp.name)
              .join(' → ')
            }
          </Text>
        </View>
      )}

      <View style={styles.routeActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.background }]}
          onPress={() => {
          // Navegar a la pantalla de mapa con los datos de la ruta
            router.push({
            pathname: '/(tabs)/map',
            params: { 
              editMode: 'true',
              routeId: item.id,
              routeData: JSON.stringify(item)
            }
          });
        }}
>
  <Ionicons name="pencil" size={16} color={colors.tint} />
  <Text style={[styles.actionButtonText, { color: colors.tint }]}>Editar</Text>
</TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.duplicateButton, { backgroundColor: colors.background }]}
          onPress={() => duplicateRoute(item.id, item.name)}
        >
          <Ionicons name="copy" size={16} color={colors.warning} />
          <Text style={[styles.actionButtonText, { color: colors.warning }]}>Duplicar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.background }]}
          onPress={() => deleteRoute(item.id, item.name)}
        >
          <Ionicons name="trash" size={16} color={colors.danger} />
          <Text style={[styles.actionButtonText, { color: colors.danger }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDayFilter = () => (
    <View style={styles.dayFilters}>
      <TouchableOpacity
        style={[
          styles.dayFilter,
          { backgroundColor: selectedDay === null ? colors.tint : colors.background },
          { borderColor: colors.border }
        ]}
        onPress={() => setSelectedDay(null)}
      >
        <Text style={[
          styles.dayFilterText,
          { color: selectedDay === null ? '#ffffff' : colors.text }
        ]}>
          Todos
        </Text>
      </TouchableOpacity>
      
      {dayNames.map((day, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dayFilter,
            { backgroundColor: selectedDay === index ? colors.tint : colors.background },
            { borderColor: colors.border }
          ]}
          onPress={() => setSelectedDay(index)}
        >
          <Text style={[
            styles.dayFilterText,
            { color: selectedDay === index ? '#ffffff' : colors.text }
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        {selectedDay !== null 
          ? `No hay rutas para ${dayNamesFull[selectedDay]}`
          : searchText 
            ? 'No se encontraron rutas'
            : 'No tienes rutas guardadas'
        }
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {selectedDay !== null || searchText
          ? 'Prueba con otros filtros o crea una nueva ruta'
          : 'Ve a la pestaña Mapa para crear tu primera ruta'
        }
      </Text>
    </View>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      margin: 15,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.tint,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Barra de búsqueda */}
      <View style={dynamicStyles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar rutas..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros por día */}
      {renderDayFilter()}

      {/* Lista de rutas */}
      <FlatList
        data={routes}
        renderItem={renderRoute}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Estadísticas en la parte inferior */}
      {routes.length > 0 && (
        <View style={dynamicStyles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={dynamicStyles.statNumber}>{routes.length}</Text>
            <Text style={dynamicStyles.statLabel}>Rutas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={dynamicStyles.statNumber}>
              {routes.filter(r => r.is_active).length}
            </Text>
            <Text style={dynamicStyles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={dynamicStyles.statNumber}>
              {routes.reduce((sum, r) => sum + r.waypoints.length, 0)}
            </Text>
            <Text style={dynamicStyles.statLabel}>Puntos</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: 10,
  },
  dayFilters: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  dayFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    borderWidth: 1,
  },
  dayFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  routeCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDay: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  routeStatus: {
    marginLeft: 10,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeDetails: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  waypointsPreview: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  waypointsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  waypointsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  editButton: {},
  duplicateButton: {},
  deleteButton: {},
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
});