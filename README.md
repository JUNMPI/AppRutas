# 🗺️ AppRutas - Sistema de Planificación de Rutas Diarias

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.20-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Descripción del Proyecto

**AppRutas** es una aplicación móvil desarrollada con React Native y Expo que permite a los usuarios planificar, gestionar y optimizar sus rutas diarias de manera eficiente. La aplicación está diseñada para facilitar la organización de trayectos recurrentes, permitiendo a los usuarios crear rutas personalizadas para cada día de la semana y visualizarlas en un mapa interactivo.

### 🎯 Objetivo Principal

Proporcionar una herramienta intuitiva y eficiente para la planificación de rutas diarias, optimizando el tiempo y los recursos de desplazamiento de los usuarios, ya sean profesionales de delivery, vendedores, o personas que necesiten organizar sus trayectos cotidianos.

## ✨ Características Principales

- **🔐 Sistema de Autenticación**: Registro y login seguro de usuarios
- **🗺️ Visualización de Mapas**: Integración con mapas nativos para visualizar y crear rutas
- **📅 Gestión por Días**: Organización de rutas específicas para cada día de la semana
- **📍 Marcadores Personalizados**: Añadir puntos de interés y paradas en las rutas
- **💾 Almacenamiento Local**: Persistencia de datos usando AsyncStorage
- **📱 Interfaz Intuitiva**: Diseño moderno y responsive con navegación por tabs
- **🌓 Modo Claro/Oscuro**: Soporte para temas según preferencias del sistema

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
AppRutas/
├── app/                      # Navegación y pantallas (Expo Router)
│   ├── (auth)/              # Stack de autenticación
│   │   ├── _layout.tsx      # Layout del stack de auth
│   │   ├── login.tsx        # Pantalla de inicio de sesión
│   │   └── register.tsx     # Pantalla de registro
│   ├── (tabs)/              # Navegación principal por tabs
│   │   ├── _layout.tsx      # Configuración de tabs
│   │   ├── index.tsx        # Pantalla de inicio
│   │   ├── map.tsx          # Pantalla del mapa
│   │   ├── routes.tsx       # Gestión de rutas
│   │   └── profile.tsx      # Perfil de usuario
│   ├── _layout.tsx          # Layout raíz
│   └── index.tsx            # Punto de entrada
├── components/              # Componentes reutilizables
│   └── ui/                  # Componentes de UI
├── hooks/                   # Custom hooks
├── constants/               # Constantes y configuración
├── assets/                  # Recursos estáticos
└── package.json            # Dependencias y scripts
```

### Patrón de Arquitectura

La aplicación sigue una arquitectura basada en componentes con las siguientes características:

- **File-based Routing**: Utilizando Expo Router para navegación declarativa
- **Component-Based Architecture**: Componentes modulares y reutilizables
- **State Management**: Estado local con React Hooks (useState, useEffect)
- **Async Storage**: Persistencia de datos local para autenticación y preferencias

## 🛠️ Stack Tecnológico

### Core

- **React Native** (0.79.5) - Framework para desarrollo móvil multiplataforma
- **Expo** (~53.0.20) - Plataforma de desarrollo y distribución
- **TypeScript** (5.8.3) - Superset de JavaScript con tipado estático

### Navegación

- **Expo Router** (~5.1.4) - Sistema de navegación basado en archivos
- **React Navigation** (7.1.6) - Biblioteca de navegación subyacente

### UI/UX

- **@expo/vector-icons** (14.1.0) - Iconos vectoriales (Ionicons)
- **React Native Gesture Handler** (2.24.0) - Gestos nativos
- **React Native Reanimated** (3.17.4) - Animaciones de alto rendimiento
- **React Native Safe Area Context** (5.4.0) - Manejo de áreas seguras

### Mapas y Geolocalización

- **React Native Maps** (1.25.3) - Integración con mapas nativos (Google Maps/Apple Maps)

### Almacenamiento

- **@react-native-async-storage/async-storage** (2.2.0) - Almacenamiento persistente

### Herramientas de Desarrollo

- **ESLint** - Linting y análisis de código
- **Babel** - Transpilación de JavaScript
- **Metro** - Bundler de JavaScript

## 📱 Funcionalidades por Pantalla

### Autenticación

- **Login**: Autenticación con email y contraseña
- **Registro**: Creación de nuevas cuentas con validación de datos

### Pantallas Principales

- **Inicio**: Dashboard con estadísticas y acciones rápidas
- **Mapa**: Visualización y creación de rutas interactivas
- **Mis Rutas**: Lista de rutas guardadas organizadas por día
- **Perfil**: Información del usuario y configuración

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- Expo CLI
- Expo Go app (para pruebas en dispositivo físico)

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/AppRutas.git
cd AppRutas
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
```

3. **Iniciar el proyecto**

```bash
npx expo start
```

4. **Ejecutar en dispositivo/emulador**

- **iOS**: Presiona `i` en la terminal
- **Android**: Presiona `a` en la terminal
- **Expo Go**: Escanea el código QR con la app Expo Go

## 🔧 Scripts Disponibles

```json
{
  "start": "expo start", // Inicia el servidor de desarrollo
  "android": "expo start --android", // Abre en emulador Android
  "ios": "expo start --ios", // Abre en simulador iOS
  "web": "expo start --web", // Abre en navegador web
  "lint": "expo lint" // Ejecuta el linter
}
```

## 📊 Estado del Proyecto

### ✅ Completado

- Sistema de autenticación (Login/Registro)
- Navegación por tabs
- Pantalla de inicio con estadísticas
- Perfil de usuario
- Estructura base del proyecto

### 🚧 En Desarrollo

- Integración completa con mapas
- Sistema de creación de rutas
- Guardado de rutas por día
- Optimización de rutas

### 📋 Próximas Características

- [ ] Compartir rutas con otros usuarios
- [ ] Notificaciones push para recordatorios
- [ ] Modo offline completo
- [ ] Exportación de rutas (PDF/Excel)
- [ ] Integración con calendarios
- [ ] Cálculo de tiempo y distancia estimados

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo de Desarrollo

- **Desarrollador Principal** - [Tu Nombre]
- **Diseño UI/UX** - [Nombre del Diseñador]
- **Backend** - [Nombre del Backend Dev]

## 📞 Contacto

Para preguntas o soporte, contactar a:

- Email: contacto@apprutas.com
- GitHub Issues: [https://github.com/tu-usuario/AppRutas/issues](https://github.com/tu-usuario/AppRutas/issues)

## 🙏 Agradecimientos

- Expo Team por la excelente plataforma de desarrollo
- React Native Community por las bibliotecas y el soporte
- Todos los contribuidores y testers del proyecto

---

**Desarrollado con ❤️ en Chiclayo, Perú**
