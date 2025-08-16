import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // Si usas emulador Android
    return __DEV__ ? 'http://10.0.2.2:5000/api' : 'http://192.168.100.4:5000/api';
  } else if (Platform.OS === 'ios') {
    // Para simulador iOS
    return 'exp://ohp8e-m-anonymous-8081.exp.direct';
  } else {
    // Para dispositivo físico o web
    return 'http://192.168.100.4:5000/api';
  }
};
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userEmail');
    }
    return Promise.reject(error);
  }
);

export default api;