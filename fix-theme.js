#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Verificando y arreglando el sistema de temas...\n');

// Verificar si el archivo useTheme existe con la extensión correcta
const hooksDir = path.join(process.cwd(), 'hooks');
const oldPath = path.join(hooksDir, 'useTheme.ts');
const newPath = path.join(hooksDir, 'useTheme.tsx');

// Paso 1: Renombrar el archivo si es necesario
if (fs.existsSync(oldPath)) {
  console.log('📝 Renombrando useTheme.ts a useTheme.tsx...');
  fs.renameSync(oldPath, newPath);
  console.log('✅ Archivo renombrado correctamente\n');
} else if (fs.existsSync(newPath)) {
  console.log('✅ useTheme.tsx ya existe\n');
} else {
  console.log('❌ No se encontró el archivo useTheme\n');
}

// Paso 2: Verificar las importaciones en todos los archivos
const filesToCheck = [
  'app/_layout.tsx',
  'app/(auth)/_layout.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/theme-test.tsx',
  'components/ThemeToggle.tsx'
];

console.log('🔍 Verificando importaciones...\n');

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si tiene la importación correcta
    if (content.includes("from '../hooks/useTheme'") || 
        content.includes("from '../../hooks/useTheme'")) {
      console.log(`✅ ${file} - Importación correcta`);
    } else if (content.includes('useTheme')) {
      console.log(`⚠️  ${file} - Usa useTheme pero podría tener importación incorrecta`);
    }
  } else {
    console.log(`⚠️  ${file} - Archivo no encontrado`);
  }
});

console.log('\n📋 Pasos para completar:\n');
console.log('1. Detén el servidor de Expo (Ctrl+C)');
console.log('2. Limpia la caché: npx expo start -c');
console.log('3. En tu dispositivo, cierra completamente Expo Go');
console.log('4. Vuelve a abrir Expo Go y escanea el código QR');
console.log('\n✨ El sistema de temas debería funcionar correctamente ahora!');

// Crear un archivo de verificación
const verificationContent = `
// Este archivo verifica que el sistema de temas esté configurado correctamente
import { useTheme } from './hooks/useTheme';

export function ThemeVerification() {
  const { theme, colors } = useTheme();
  
  console.log('Tema actual:', theme);
  console.log('Colores actuales:', colors);
  
  return true;
}
`;

fs.writeFileSync(path.join(process.cwd(), 'theme-verification.tsx'), verificationContent);
console.log('\n📄 Archivo de verificación creado: theme-verification.tsx');