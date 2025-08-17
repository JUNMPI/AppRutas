import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.100.4:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();
      console.log('Respuesta login:', data);

      if (response.ok && data.success) {
        // Guardar datos correctamente
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('userEmail', data.data.user.email);
        await AsyncStorage.setItem('userName', data.data.user.fullName || 'Usuario');

        console.log('Nombre guardado:', data.data.user.fullName);
        
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      backgroundColor: colors.cardBackground,
      padding: 30,
      borderRadius: 15,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 15,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      color: colors.text,
    },
    loginButton: {
      backgroundColor: colors.tint,
      paddingVertical: 15,
      borderRadius: 10,
      marginTop: 25,
      alignItems: 'center',
    },
    loginButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    loginButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    registerButton: {
      marginTop: 20,
      alignItems: 'center',
    },
    registerButtonText: {
      color: colors.tint,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={dynamicStyles.content}>
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>🗺️ Mis Rutas</Text>
          <Text style={dynamicStyles.subtitle}>Planifica tus rutas diarias</Text>
        </View>

        <View style={dynamicStyles.form}>
          <Text style={dynamicStyles.label}>Email</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={dynamicStyles.label}>Contraseña</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="Tu contraseña"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[dynamicStyles.loginButton, isLoading && dynamicStyles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={dynamicStyles.loginButtonText}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.registerButton}
            onPress={handleRegister}
          >
            <Text style={dynamicStyles.registerButtonText}>
              ¿No tienes cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
});