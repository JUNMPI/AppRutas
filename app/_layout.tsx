import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const { currentColorScheme, colors, isLoading } = useTheme();

  // Si el tema está cargando, mostrar una pantalla de carga
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade'
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={currentColorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}