import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

export default function RootLayout() {
  const { currentColorScheme } = useTheme();

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' } // Permite que cada pantalla maneje su fondo
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={currentColorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}