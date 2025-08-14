import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import api from '../../services/api';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'La contraseña debe contener al menos una letra minúscula';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos un número';
    }
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    // Validaciones
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (formData.fullName.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined
      });

      if (response.data.success) {
        // Guardar datos de sesión
        await AsyncStorage.setItem('authToken', response.data.data.token);
        await AsyncStorage.setItem('userEmail', response.data.data.user.email);
        await AsyncStorage.setItem('userName', response.data.data.user.fullName);

        Alert.alert(
          '¡Registro Exitoso!', 
          'Tu cuenta ha sido creada correctamente',
          [
            {
              text: 'Continuar',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      let errorMessage = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'El email ya está registrado o los datos son inválidos';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Error del servidor. Inténtalo más tarde.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>🗺️ Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete y organiza tus rutas diarias</Text>
          </View>

          <View style={styles.form}>
            {/* Nombre Completo */}
            <Text style={styles.label}>Nombre Completo *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre completo"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Teléfono */}
            <Text style={styles.label}>Teléfono (Opcional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu número de teléfono"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Contraseña */}
            <Text style={styles.label}>Contraseña *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            <Text style={styles.label}>Confirmar Contraseña *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* Requisitos de contraseña */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>La contraseña debe contener:</Text>
              <Text style={styles.requirement}>• Al menos 8 caracteres</Text>
              <Text style={styles.requirement}>• Una letra mayúscula</Text>
              <Text style={styles.requirement}>• Una letra minúscula</Text>
              <Text style={styles.requirement}>• Un número</Text>
            </View>

            {/* Botón de registro */}
            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Text>
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón de login */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>
                ¿Ya tienes cuenta? Inicia Sesión
              </Text>
            </TouchableOpacity>
          </View>

          {/* Términos y condiciones */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              Al crear una cuenta, aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos de Servicio</Text>
              {' '}y{' '}
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  eyeIcon: {
    padding: 5,
  },
  passwordRequirements: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  registerButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 25,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  separatorText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: '#7f8c8d',
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  loginButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3498db',
    fontWeight: '500',
  },
});