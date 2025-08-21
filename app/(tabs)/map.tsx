import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';

// Importación condicional de MapView
let MapView: any = View;
let Marker: any = View;
let Polyline: any = View;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps.MapView;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch {
    console.log('react-native-maps no está disponible');
  }
}

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
  waypoint_type?: 'start' | 'stop' | 'end';
}

export default function MapScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';
  const editRouteId = params.routeId as string;
  const editRouteData = params.routeData ? JSON.parse(params.routeData as string) : null;

  const [region, setRegion] = useState({
    latitude: -6.7775,
    longitude: -79.8451,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [waypointName, setWaypointName] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Cargar datos de la ruta si estamos en modo edición
  useEffect(() => {
    if (isEditMode && editRouteData) {
      setRouteName(editRouteData.name);
      setRouteDescription(editRouteData.description || '');
      setSelectedDay(editRouteData.day_of_week);
      setStartTime(editRouteData.start_time || '');
      
      // Cargar waypoints con el formato correcto
      if (editRouteData.waypoints && editRouteData.waypoints.length > 0) {
        const sortedWaypoints = editRouteData.waypoints.sort((a: any, b: any) => a.order_index - b.order_index);
        const formattedWaypoints: Waypoint[] = sortedWaypoints.map((wp: any) => ({
          id: wp.id || (Date.now().toString() + Math.random().toString()),
          name: wp.name,
          latitude: typeof wp.latitude === 'string' ? parseFloat(wp.latitude) : wp.latitude,
          longitude: typeof wp.longitude === 'string' ? parseFloat(wp.longitude) : wp.longitude,
          order_index: wp.order_index,
          waypoint_type: wp.waypoint_type as 'start' | 'stop' | 'end' | undefined
        }));
        setWaypoints(formattedWaypoints);
        
        // Centrar el mapa en el primer waypoint
        if (formattedWaypoints.length > 0) {
          setRegion({
            latitude: formattedWaypoints[0].latitude,
            longitude: formattedWaypoints[0].longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
      
      setIsEditing(true);
    }
  }, [isEditMode, editRouteData]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la ubicación para mostrar el mapa');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      getCurrentLocation();
    }
  }, [getCurrentLocation, isEditMode]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setModalVisible(true);
  };

  const addWaypoint = () => {
    if (!waypointName.trim() || !selectedLocation) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el punto');
      return;
    }

    let waypointType: 'start' | 'stop' | 'end' = 'stop';
    if (waypoints.length === 0) {
      waypointType = 'start';
    }

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      name: waypointName.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      order_index: waypoints.length,
      waypoint_type: waypointType,
    };

    setWaypoints([...waypoints, newWaypoint]);
    setWaypointName('');
    setModalVisible(false);
    setSelectedLocation(null);
  };

  const removeWaypoint = (id: string) => {
    const updatedWaypoints = waypoints
      .filter(point => point.id !== id)
      .map((point, index) => ({ 
        ...point, 
        order_index: index,
        waypoint_type: index === 0 ? 'start' : 'stop' as 'start' | 'stop' | 'end'
      }));
    setWaypoints(updatedWaypoints);
  };

  const saveRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la ruta');
      return;
    }

    if (waypoints.length < 2) {
      Alert.alert('Error', 'La ruta debe tener al menos 2 puntos');
      return;
    }

    setIsSaving(true);

    try {
      const waypointsToSave = waypoints.map((wp, index) => ({
        ...wp,
        waypoint_type: index === 0 ? 'start' : index === waypoints.length - 1 ? 'end' : 'stop'
      }));

      const routeData = {
        name: routeName.trim(),
        description: routeDescription.trim() || null,
        day_of_week: selectedDay,
        start_time: startTime || null,
        waypoints: waypointsToSave.map(wp => ({
          name: wp.name,
          latitude: wp.latitude,
          longitude: wp.longitude,
          order_index: wp.order_index,
          waypoint_type: wp.waypoint_type,
          estimated_duration: 0,
        }))
      };

      let response;
      if (isEditing && editRouteId) {
        console.log('Actualizando ruta:', editRouteId);
        response = await api.put(`/routes/${editRouteId}`, routeData);
      } else {
        console.log('Creando nueva ruta');
        response = await api.post('/routes', routeData);
      }

      if (response.data.success) {
        Alert.alert(
          '¡Éxito!',
          isEditing ? 'Ruta actualizada correctamente' : `Ruta "${routeName}" guardada para el ${dayNames[selectedDay]}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setRouteName('');
                setRouteDescription('');
                setWaypoints([]);
                setStartTime('');
                setSelectedDay(1);
                setIsEditing(false);
                
                if (isEditing) {
                  router.back();
                }
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.error || 'Error al guardar la ruta');
      }
    } catch (error: any) {
      console.error('Error guardando ruta:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'No se pudo guardar la ruta'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const clearRoute = () => {
    Alert.alert(
      'Limpiar Ruta',
      '¿Estás seguro de que quieres limpiar todos los puntos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setWaypoints([]);
            if (!isEditing) {
              setRouteName('');
              setRouteDescription('');
              setStartTime('');
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    webContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    webTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    webText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    webButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
    },
    infoPanel: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: colors.cardBackground + 'E6',
      padding: 10,
      borderRadius: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    infoText: {
      color: colors.text,
      textAlign: 'center',
      fontSize: 14,
    },
    waypointsList: {
      position: 'absolute',
      top: 100,
      right: 20,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 10,
      maxHeight: 200,
      minWidth: 200,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    waypointItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    waypointOrder: {
      backgroundColor: colors.tint,
      color: 'white',
      width: 25,
      height: 25,
      borderRadius: 12.5,
      textAlign: 'center',
      lineHeight: 25,
      fontWeight: 'bold',
      marginRight: 10,
    },
    waypointName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      margin: 20,
      padding: 20,
      borderRadius: 15,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 5,
      marginTop: 15,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      marginBottom: 15,
      backgroundColor: colors.background,
      color: colors.text,
    },
    dayButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayButtonSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    dayButtonText: {
      fontSize: 12,
      color: colors.text,
    },
    dayButtonTextSelected: {
      color: 'white',
      fontWeight: 'bold',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 10,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addButton: {
      backgroundColor: colors.tint,
    },
    cancelButtonText: {
      textAlign: 'center',
      color: colors.text,
      fontWeight: '600',
    },
    addButtonText: {
      textAlign: 'center',
      color: 'white',
      fontWeight: '600',
    },
  });

  if (Platform.OS === 'web') {
    return (
      <View style={dynamicStyles.webContainer}>
        <Ionicons name="map-outline" size={80} color={colors.tint} />
        <Text style={dynamicStyles.webTitle}>Mapas no disponibles en Web</Text>
        <Text style={dynamicStyles.webText}>
          Por favor usa la aplicación móvil para acceder a las funciones del mapa
        </Text>
        <TouchableOpacity style={dynamicStyles.webButton}>
          <Text style={styles.webButtonText}>Descargar App Móvil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <MapView
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        {waypoints.map((waypoint, index) => (
          <Marker
            key={waypoint.id}
            coordinate={{
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
            }}
            title={waypoint.name}
            description={`Punto ${index + 1}`}
            pinColor={index === 0 ? 'green' : index === waypoints.length - 1 ? 'red' : 'orange'}
          />
        ))}
        
        {waypoints.length > 1 && (
          <Polyline
            coordinates={waypoints.map(wp => ({
              latitude: wp.latitude,
              longitude: wp.longitude,
            }))}
            strokeColor={colors.tint}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Panel de información */}
      <View style={dynamicStyles.infoPanel}>
        <Text style={dynamicStyles.infoText}>
          {isEditing ? '✏️ Editando ruta' : 'Puntos'}: {waypoints.length} | Toca el mapa para {isEditing ? 'modificar' : 'agregar'} puntos
        </Text>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {isEditing && (
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: colors.textSecondary }]} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
              <Text style={styles.controlButtonText}>Volver</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.tint }]} onPress={getCurrentLocation}>
            <Ionicons name="location" size={20} color="white" />
            <Text style={styles.controlButtonText}>Mi Ubicación</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.danger }]} 
            onPress={clearRoute}
            disabled={waypoints.length === 0}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.controlButtonText}>Limpiar</Text>
          </TouchableOpacity>
          
          {waypoints.length >= 2 && (
            <TouchableOpacity 
              style={[
                styles.controlButton, 
                { backgroundColor: isSaving ? colors.textSecondary : colors.success }
              ]} 
              onPress={saveRoute}
              disabled={isSaving}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.controlButtonText}>
                {isSaving ? 'Guardando...' : isEditing ? 'Actualizar Ruta' : 'Guardar Ruta'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Lista de waypoints */}
      {waypoints.length > 0 && (
        <View style={dynamicStyles.waypointsList}>
          <ScrollView>
            {waypoints.map((waypoint, index) => (
              <View key={waypoint.id} style={dynamicStyles.waypointItem}>
                <View style={styles.waypointInfo}>
                  <Text style={dynamicStyles.waypointOrder}>{index + 1}</Text>
                  <Text style={dynamicStyles.waypointName}>{waypoint.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeWaypoint(waypoint.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Modal para agregar waypoint */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              {waypoints.length === 0 && !isEditing ? 'Configurar Ruta y Primer Punto' : 'Agregar Punto'}
            </Text>
            
            <TextInput
              style={dynamicStyles.input}
              placeholder="Nombre del punto (ej: Casa, Trabajo)"
              placeholderTextColor={colors.textSecondary}
              value={waypointName}
              onChangeText={setWaypointName}
            />

            {waypoints.length === 0 && !isEditing && (
              <>
                <Text style={dynamicStyles.label}>Nombre de la ruta:</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej: Ruta al trabajo"
                  placeholderTextColor={colors.textSecondary}
                  value={routeName}
                  onChangeText={setRouteName}
                />

                <Text style={dynamicStyles.label}>Descripción (opcional):</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej: Ruta de reparto zona centro"
                  placeholderTextColor={colors.textSecondary}
                  value={routeDescription}
                  onChangeText={setRouteDescription}
                  multiline
                />

                <Text style={dynamicStyles.label}>Hora de inicio (opcional):</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej: 08:00"
                  placeholderTextColor={colors.textSecondary}
                  value={startTime}
                  onChangeText={setStartTime}
                />

                <Text style={dynamicStyles.label}>Día de la semana:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {dayNames.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        dynamicStyles.dayButton,
                        selectedDay === index && dynamicStyles.dayButtonSelected
                      ]}
                      onPress={() => setSelectedDay(index)}
                    >
                      <Text style={[
                        dynamicStyles.dayButtonText,
                        selectedDay === index && dynamicStyles.dayButtonTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setWaypointName('');
                  setSelectedLocation(null);
                }}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.addButton]}
                onPress={addWaypoint}
              >
                <Text style={dynamicStyles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  webButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  controlButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  waypointInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    padding: 5,
  },
});