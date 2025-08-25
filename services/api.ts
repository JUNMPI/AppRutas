import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  // Para desarrollo local
  if (__DEV__) {
    if (Platform.OS === 'web') {
      // Para web usa localhost
      return 'http://localhost:5000/api';
    } else {
      // IMPORTANTE: Cambia esta IP por la IP de tu computadora en la red local
      // Para encontrarla:
      // Windows: ipconfig (busca IPv4 Address)
      // Mac/Linux: ifconfig o ip addr
      const YOUR_LOCAL_IP = '192.168.100.4'; // <-- CAMBIA ESTO
      return `http://${YOUR_LOCAL_IP}:5000/api`;
    }
  } else {
    // Para producción (cambia esto a tu servidor de producción)
    return 'https://tu-servidor.com/api';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Request to:', config.url);
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url);
    return response;
  },
  async (error) => {
    console.error('Response error:', error.message);
    
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userName');
    }
    
    // Proporcionar mejor información del error
    if (error.code === 'ECONNREFUSED') {
      console.error('No se puede conectar al servidor. Asegúrate de que el backend esté corriendo.');
      console.error('Si usas Docker, verifica que todos los servicios estén arriba con: docker-compose ps');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Timeout: El servidor tardó demasiado en responder.');
    } else if (!error.response) {
      console.error('Error de red: No hay respuesta del servidor.');
    }
    
    return Promise.reject(error);
  }
);

export default api;