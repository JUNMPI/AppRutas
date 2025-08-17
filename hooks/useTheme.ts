import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'user_theme_preference';

export function useTheme() {
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
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = 
      theme === 'light' ? 'dark' : 
      theme === 'dark' ? 'system' : 
      'light';
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

  return {
    theme,
    currentColorScheme,
    colors,
    isLoading,
    changeTheme,
    toggleTheme,
    getThemeIcon,
    getThemeLabel,
  };
}