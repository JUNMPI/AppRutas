import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        // Usuario ya autenticado, ir a tabs
        router.replace('/(tabs)');
      } else {
        // Usuario no autenticado, ir a login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      // Error al verificar, ir a login por seguridad
      router.replace('/(auth)/login');
    }
  };

  return null; // No renderiza nada, solo redirige
}