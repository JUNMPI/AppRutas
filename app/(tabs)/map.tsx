import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
}

export default function MapScreen() {
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
  const [selectedDay, setSelectedDay] = useState(1); // Lunes por defecto

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la ubicación para mostrar el mapa');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

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

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      name: waypointName.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      order_index: waypoints.length,
    };

    setWaypoints([...waypoints, newWaypoint]);
    setWaypointName('');
    setModalVisible(false);
    setSelectedLocation(null);
  };

  const removeWaypoint = (id: string) => {
    const updatedWaypoints = waypoints
      .filter(point => point.id !== id)
      .map((point, index) => ({ ...point, order_index: index }));
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

    try {
      // Aquí integrarías con tu API
      // const response = await api.post('/routes', {
      //   name: routeName,
      //   day_of_week: selectedDay,
      //   waypoints: waypoints.map(wp => ({
      //     name: wp.name,
      //     latitude: wp.latitude,
      //     longitude: wp.longitude,
      //     order_index: wp.order_index,
      //     waypoint_type: wp.order_index === 0 ? 'start' : wp.order_index === waypoints.length - 1 ? 'end' : 'stop'
      //   }))
      // });

      Alert.alert(
        'Éxito',
        `Ruta "${routeName}" guardada para el ${dayNames[selectedDay]}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setRouteName('');
              setWaypoints([]);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la ruta');
    }
  };

  const clearRoute = () => {
    setWaypoints([]);
    setRouteName('');
  };

  return (
    <View style={styles.container}>
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
            strokeColor="#3498db"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          Puntos: {waypoints.length} | Toca el mapa para agregar puntos
        </Text>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.controlButton} onPress={getCurrentLocation}>
            <Ionicons name="location" size={20} color="white" />
            <Text style={styles.controlButtonText}>Mi Ubicación</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: '#e74c3c' }]} 
            onPress={clearRoute}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.controlButtonText}>Limpiar</Text>
          </TouchableOpacity>
          
          {waypoints.length >= 2 && (
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: '#27ae60' }]} 
              onPress={saveRoute}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.controlButtonText}>Guardar Ruta</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Lista de waypoints */}
      {waypoints.length > 0 && (
        <View style={styles.waypointsList}>
          <ScrollView>
            {waypoints.map((waypoint, index) => (
              <View key={waypoint.id} style={styles.waypointItem}>
                <View style={styles.waypointInfo}>
                  <Text style={styles.waypointOrder}>{index + 1}</Text>
                  <Text style={styles.waypointName}>{waypoint.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeWaypoint(waypoint.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#e74c3c" />
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Punto</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre del punto (ej: Casa, Trabajo)"
              value={waypointName}
              onChangeText={setWaypointName}
            />

            {waypoints.length === 0 && (
              <>
                <Text style={styles.label}>Nombre de la ruta:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Ruta al trabajo"
                  value={routeName}
                  onChangeText={setRouteName}
                />

                <Text style={styles.label}>Día de la semana:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {dayNames.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        selectedDay === index && styles.dayButtonSelected
                      ]}
                      onPress={() => setSelectedDay(index)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        selectedDay === index && styles.dayButtonTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setWaypointName('');
                  setSelectedLocation(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addWaypoint}
              >
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 10,
  },
  infoText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: '#3498db',
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
  waypointsList: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: 200,
    minWidth: 200,
    shadowColor: '#000',
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
    borderBottomColor: '#f0f0f0',
  },
  waypointInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  waypointOrder: {
    backgroundColor: '#3498db',
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
  },
  removeButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  dayButtonSelected: {
    backgroundColor: '#3498db',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  addButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});