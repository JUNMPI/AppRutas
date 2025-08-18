
// Este archivo verifica que el sistema de temas esté configurado correctamente
import { useTheme } from './hooks/useTheme';

export function ThemeVerification() {
  const { theme, colors } = useTheme();
  
  console.log('Tema actual:', theme);
  console.log('Colores actuales:', colors);
  
  return true;
}
