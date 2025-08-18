// components/MapComponent.tsx
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Importación condicional de MapView
let MapView: any = View;
let Marker: any = View;
let Polyline: any = View;
let PROVIDER_GOOGLE: any = undefined;
let PROVIDER_DEFAULT: any = undefined;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps.MapView;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  } catch (error) {
    console.log('react-native-maps no está disponible:', error);
  }
}

interface MapComponentProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  waypoints: Array<{
    id: string;
    latitude: number;
    longitude: number;
    name: string;
  }>;
  onMapPress?: (event: any) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
}

export default function MapComponent({
  region,
  waypoints,
  onMapPress,
  showsUserLocation = true,
  children
}: MapComponentProps) {
  const { colors } = useTheme();

  // Detectar qué provider usar según la plataforma
  const getMapProvider = () => {
    if (Platform.OS === 'ios') {
      // En iOS, usa Apple Maps por defecto (es gratis y funciona sin configuración)
      // Si quieres forzar Google Maps en iOS, descomenta la siguiente línea:
      // return PROVIDER_GOOGLE;
      return PROVIDER_DEFAULT; // Apple Maps
    } else if (Platform.OS === 'android') {
      // En Android, siempre usa Google Maps (es el único disponible)
      return PROVIDER_GOOGLE;
    }
    return undefined;
  };

  // Si estamos en web, mostrar mensaje
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.webText, { color: colors.text }]}>
          Los mapas no están disponibles en la versión web.
          Por favor, usa la aplicación móvil.
        </Text>
      </View>
    );
  }

  // Verificar si MapView está disponible
  if (!MapView || MapView === View) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Error: react-native-maps no está instalado correctamente.
        </Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          Ejecuta: npx expo install react-native-maps
        </Text>
      </View>
    );
  }

  return (
    <MapView
      provider={getMapProvider()}
      style={styles.map}
      region={region}
      onPress={onMapPress}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsUserLocation}
      showsCompass={true}
      showsScale={true}
      loadingEnabled={true}
      loadingIndicatorColor={colors.tint}
      loadingBackgroundColor={colors.background}
      // Configuración específica para Android
      {...(Platform.OS === 'android' && {
        minZoomLevel: 5,
        maxZoomLevel: 20,
        rotateEnabled: true,
        scrollEnabled: true,
        zoomEnabled: true,
        pitchEnabled: true,
      })}
      // Configuración específica para iOS
      {...(Platform.OS === 'ios' && {
        showsTraffic: false,
        showsBuildings: true,
        showsIndoors: true,
        showsPointsOfInterest: true,
      })}
    >
      {/* Marcadores */}
      {waypoints.map((waypoint, index) => (
        <Marker
          key={waypoint.id}
          coordinate={{
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
          }}
          title={waypoint.name}
          description={`Punto ${index + 1}`}
          // Colores de los pines según su posición
          pinColor={
            index === 0 
              ? '#27ae60' // Verde para inicio
              : index === waypoints.length - 1 
                ? '#e74c3c' // Rojo para final
                : '#f39c12' // Naranja para puntos intermedios
          }
          // En Android puedes usar iconos personalizados
          {...(Platform.OS === 'android' && {
            tracksViewChanges: false, // Mejora el rendimiento en Android
          })}
        />
      ))}
      
      {/* Línea de ruta */}
      {waypoints.length > 1 && (
        <Polyline
          coordinates={waypoints.map(wp => ({
            latitude: wp.latitude,
            longitude: wp.longitude,
          }))}
          strokeColor={colors.tint}
          strokeWidth={Platform.OS === 'ios' ? 3 : 4} // Más gruesa en Android
          lineDashPattern={Platform.OS === 'ios' ? undefined : [1, 0]} // Línea sólida
          geodesic={true} // Sigue la curvatura de la tierra
        />
      )}
      
      {/* Contenido adicional (controles, etc.) */}
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});