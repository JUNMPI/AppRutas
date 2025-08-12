import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#8e8e93',
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
    </Tabs>
  );
}