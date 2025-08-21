import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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

interface Waypoint {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
  waypoint_type?: 'start' | 'stop' | 'end';
}

export default function EditRouteScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    if (id) {
      loadRoute();
    }
  }, [id]);

  const loadRoute = async () => {
    try {
      const response = await api.get(`/routes/${id}`);
      
      if (response.data.success) {
        const route = response.data.data;
        setRouteName(route.name);
        setRouteDescription(route.description || '');
        setSelectedDay(route.day_of_week);
        setStartTime(route.start_time || '');
        setIsActive(route.is_active);
        setWaypoints(route.waypoints || []);
      }
    } catch (error) {
      console.error('Error cargando ruta:', error);
      Alert.alert('Error', 'No se pudo cargar la ruta');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'El nombre de la ruta es requerido');
      return;
    }

    setSaving(true);

    try {
      const response = await api.put(`/routes/${id}`, {
        name: routeName.trim(),
        description: routeDescription.trim(),
        day_of_week: selectedDay,
        start_time: startTime || null,
        is_active: isActive,
        waypoints: waypoints.map((wp, index) => ({
          ...wp,
          order_index: index,
          waypoint_type: index === 0 ? 'start' : index === waypoints.length - 1 ? 'end' : 'stop'
        }))
      });

      if (response.data.success) {
        Alert.alert('Éxito', 'Ruta actualizada correctamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error actualizando ruta:', error);
      Alert.alert('Error', 'No se pudo actualizar la ruta');
    } finally {
      setSaving(false);
    }
  };

  const updateWaypoint = (index: number, field: string, value: string) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = {
      ...newWaypoints[index],
      [field]: value
    };
    setWaypoints(newWaypoints);
  };

  const removeWaypoint = (index: number) => {
    if (waypoints.length <= 2) {
      Alert.alert('Error', 'La ruta debe tener al menos 2 puntos');
      return;
    }
    
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= waypoints.length) return;
    
    const newWaypoints = [...waypoints];
    [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]];
    setWaypoints(newWaypoints);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Editar Ruta</Text>
            <View style={styles.backButton} />
          </View>

          {/* Formulario */}
          <View style={[styles.form, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.label, { color: colors.text }]}>Nombre de la ruta</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={routeName}
              onChangeText={setRouteName}
              placeholder="Ej: Ruta de reparto centro"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={routeDescription}
              onChangeText={setRouteDescription}
              placeholder="Descripción opcional..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text }]}>Día de la semana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedDay === index && { backgroundColor: colors.tint, borderColor: colors.tint }
                  ]}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    { color: colors.text },
                    selectedDay === index && { color: 'white' }
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text }]}>Hora de inicio (opcional)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="Ej: 08:00"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Ruta activa</Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  { backgroundColor: isActive ? colors.success : colors.textSecondary }
                ]}
                onPress={() => setIsActive(!isActive)}
              >
                <View style={[
                  styles.switchThumb,
                  { transform: [{ translateX: isActive ? 20 : 0 }] }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Waypoints */}
          <View style={[styles.waypointsSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Puntos de la ruta ({waypoints.length})
            </Text>

            {waypoints.map((waypoint, index) => (
              <View key={index} style={[styles.waypointCard, { backgroundColor: colors.background }]}>
                <View style={styles.waypointHeader}>
                  <Text style={[styles.waypointNumber, { backgroundColor: colors.tint }]}>
                    {index + 1}
                  </Text>
                  <TextInput
                    style={[styles.waypointInput, { color: colors.text }]}
                    value={waypoint.name}
                    onChangeText={(text) => updateWaypoint(index, 'name', text)}
                    placeholder="Nombre del punto"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.waypointActions}>
                  {index > 0 && (
                    <TouchableOpacity onPress={() => moveWaypoint(index, 'up')}>
                      <Ionicons name="arrow-up" size={20} color={colors.tint} />
                    </TouchableOpacity>
                  )}
                  {index < waypoints.length - 1 && (
                    <TouchableOpacity onPress={() => moveWaypoint(index, 'down')}>
                      <Ionicons name="arrow-down" size={20} color={colors.tint} />
                    </TouchableOpacity>
                  )}
                  {waypoints.length > 2 && (
                    <TouchableOpacity onPress={() => removeWaypoint(index)}>
                      <Ionicons name="trash" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Botones de acción */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  daysContainer: {
    marginVertical: 10,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  waypointsSection: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  waypointCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  waypointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  waypointNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    color: 'white',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 10,
  },
  waypointInput: {
    flex: 1,
    fontSize: 16,
  },
  waypointActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});