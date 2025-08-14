import { Ionicons } from '@expo/vector-icons';
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
    } catch (error) {
      console.error('Error cargando rutas:', error);
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
            } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo duplicar la ruta');
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'N/A';
    return distance < 1 
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <Text style={styles.routeDay}>{dayNamesFull[item.day_of_week]}</Text>
          {item.description && (
            <Text style={styles.routeDescription}>{item.description}</Text>
          )}
        </View>
        
        <View style={styles.routeStatus}>
          <TouchableOpacity
            style={[
              styles.statusIndicator,
              { backgroundColor: item.is_active ? '#27ae60' : '#e74c3c' }
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
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.waypoints.length} puntos
          </Text>
        </View>
        
        {item.total_distance && (
          <View style={styles.detailItem}>
            <Ionicons name="map" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDistance(item.total_distance)}
            </Text>
          </View>
        )}
        
        {item.start_time && (
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.detailText}>{item.start_time}</Text>
          </View>
        )}
      </View>

      {item.waypoints.length > 0 && (
        <View style={styles.waypointsPreview}>
          <Text style={styles.waypointsTitle}>Ruta:</Text>
          <Text style={styles.waypointsText}>
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
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Info', 'Función de edición pendiente')}
        >
          <Ionicons name="pencil" size={16} color="#3498db" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.duplicateButton]}
          onPress={() => duplicateRoute(item.id, item.name)}
        >
          <Ionicons name="copy" size={16} color="#f39c12" />
          <Text style={styles.actionButtonText}>Duplicar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteRoute(item.id, item.name)}
        >
          <Ionicons name="trash" size={16} color="#e74c3c" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDayFilter = () => (
    <View style={styles.dayFilters}>
      <TouchableOpacity
        style={[
          styles.dayFilter,
          selectedDay === null && styles.dayFilterSelected
        ]}
        onPress={() => setSelectedDay(null)}
      >
        <Text style={[
          styles.dayFilterText,
          selectedDay === null && styles.dayFilterTextSelected
        ]}>
          Todos
        </Text>
      </TouchableOpacity>
      
      {dayNames.map((day, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dayFilter,
            selectedDay === index && styles.dayFilterSelected
          ]}
          onPress={() => setSelectedDay(index)}
        >
          <Text style={[
            styles.dayFilterText,
            selectedDay === index && styles.dayFilterTextSelected
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={80} color="#bdc3c7" />
      <Text style={styles.emptyStateTitle}>
        {selectedDay !== null 
          ? `No hay rutas para ${dayNamesFull[selectedDay]}`
          : searchText 
            ? 'No se encontraron rutas'
            : 'No tienes rutas guardadas'
        }
      </Text>
      <Text style={styles.emptyStateText}>
        {selectedDay !== null || searchText
          ? 'Prueba con otros filtros o crea una nueva ruta'
          : 'Ve a la pestaña Mapa para crear tu primera ruta'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar rutas..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" size={20} color="#666" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Estadísticas en la parte inferior */}
      {routes.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{routes.length}</Text>
            <Text style={styles.statLabel}>Rutas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {routes.filter(r => r.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {routes.reduce((sum, r) => sum + r.waypoints.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#e9ecef',
  },
  dayFilterSelected: {
    backgroundColor: '#3498db',
  },
  dayFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayFilterTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
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
    color: '#2c3e50',
    marginBottom: 4,
  },
  routeDay: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#7f8c8d',
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
    color: '#666',
    marginLeft: 4,
  },
  waypointsPreview: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  waypointsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  waypointsText: {
    fontSize: 12,
    color: '#2c3e50',
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
  editButton: {
    backgroundColor: '#ecf0f1',
  },
  duplicateButton: {
    backgroundColor: '#fdf2e9',
  },
  deleteButton: {
    backgroundColor: '#fadbd8',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#2c3e50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
});