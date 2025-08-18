import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme_preference';

// Definir el tipo del contexto
interface ThemeContextType {
  theme: Theme;
  currentColorScheme: ColorScheme;
  colors: typeof Colors.light;
  isLoading: boolean;
  changeTheme: (newTheme: Theme) => Promise<void>;
  toggleTheme: () => void;
  getThemeIcon: () => string;
  getThemeLabel: () => string;
}

// Crear el contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider del tema
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Determinar el esquema de color actual
  const currentColorScheme: ColorScheme = 
    theme === 'system' 
      ? (systemColorScheme || 'light')
      : theme === 'dark' 
        ? 'dark' 
        : 'light';

  const colors = Colors[currentColorScheme];

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('Tema cargado desde storage:', savedTheme);
      
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
      } else {
        setTheme('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setTheme('system');
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (newTheme: Theme) => {
    try {
      console.log('Cambiando tema a:', newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
      console.log('Tema guardado y aplicado:', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    changeTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return 'phone-portrait';
      default:
        return 'sunny';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'system':
        return 'Sistema';
      default:
        return 'Claro';
    }
  };

  const value: ThemeContextType = {
    theme,
    currentColorScheme,
    colors,
    isLoading,
    changeTheme,
    toggleTheme,
    getThemeIcon,
    getThemeLabel,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar el tema
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (!context) {
    // Si no hay contexto, lanzar error o proporcionar valores por defecto
    const systemColorScheme = useColorScheme();
    const defaultColorScheme: ColorScheme = systemColorScheme || 'light';
    
    return {
      theme: 'system' as Theme,
      currentColorScheme: defaultColorScheme,
      colors: Colors[defaultColorScheme],
      isLoading: false,
      changeTheme: async (_: Theme) => {
        console.warn('ThemeProvider no está configurado');
      },
      toggleTheme: () => {
        console.warn('ThemeProvider no está configurado');
      },
      getThemeIcon: () => 'sunny',
      getThemeLabel: () => 'Sistema',
    };
  }
  
  return context;
}