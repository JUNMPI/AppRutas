import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Detectar la URL correcta según la plataforma
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api'; // Para emulador Android
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api'; // Para simulador iOS
  } else {
    return 'http://192.168.1.100:3000/api'; // Tu IP local para dispositivo físico
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpiar y redirigir a login
      await AsyncStorage.removeItem('authToken');
      // Aquí podrías redirigir a login
    }
    return Promise.reject(error);
  }
);

export default api;