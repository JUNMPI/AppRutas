import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#ffffff',
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: '🗺️ Mis Rutas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          headerTitle: 'Planificar Ruta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size || 24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          headerTitle: 'Mis Rutas Guardadas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size || 24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
          ),
        }}
      />
      
      {/* Pantalla temporal para probar temas - ELIMINAR EN PRODUCCIÓN */}
      <Tabs.Screen
        name="theme-test"
        options={{
          title: 'Tema',
          headerTitle: 'Tema',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-palette" size={size || 24} color={color} />
          ),
          // Descomenta la siguiente línea para ocultar esta pestaña:
          // href: null,
        }}
      />
      
      {/* Ocultar edit-route del tab bar */}
      <Tabs.Screen
        name="edit-route"
        options={{
          href: null, // Esto oculta la pestaña pero mantiene la ruta accesible
        }}
      />
    </Tabs>
  );
}