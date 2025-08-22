# 🗺️ AppRutas - Sistema de Planificación de Rutas Diarias

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.20-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📱 Screenshots

<div align="center">

### 🎯 Vista General de la Aplicación

<table>
  <tr>
    <td align="center">
      <img src="./screenshots/login.jpg" width="250" alt="Pantalla de Login"/>
      <br />
      <b>Inicio de Sesión</b>
      <br />
      <em>Autenticación segura con JWT</em>
    </td>
    <td align="center">
      <img src="./screenshots/crearCuenta.jpg" width="250" alt="Registro de Usuario"/>
      <br />
      <b>Crear Cuenta</b>
      <br />
      <em>Registro con validación en tiempo real</em>
    </td>
    <td align="center">
      <img src="./screenshots/inicioApp.jpg" width="250" alt="Dashboard Principal"/>
      <br />
      <b>Dashboard</b>
      <br />
      <em>Centro de control con estadísticas</em>
    </td>
  </tr>
</table>

### 🗺️ Gestión de Rutas

<table>
  <tr>
    <td align="center">
      <img src="./screenshots/mapsApp.jpg" width="250" alt="Mapa Interactivo"/>
      <br />
      <b>Creación de Rutas</b>
      <br />
      <em>Mapa interactivo con waypoints</em>
    </td>
    <td align="center">
      <img src="./screenshots/RutasApp.jpg" width="250" alt="Lista de Rutas"/>
      <br />
      <b>Mis Rutas</b>
      <br />
      <em>Gestión completa de rutas guardadas</em>
    </td>
    <td align="center">
      <img src="./screenshots/perfilApp.jpg" width="250" alt="Perfil de Usuario"/>
      <br />
      <b>Perfil</b>
      <br />
      <em>Información y estadísticas del usuario</em>
    </td>
  </tr>
</table>

### 🎨 Personalización

<div align="center">
  <img src="./screenshots/temaApp.jpg" width="250" alt="Selector de Tema"/>
  <br />
  <b>Selector de Tema</b>
  <br />
  <em>Modo claro, oscuro o seguir sistema</em>
</div>

</div>

---

## 📋 Descripción del Proyecto

**AppRutas** es una aplicación móvil completa desarrollada con React Native y Expo que permite a los usuarios planificar, gestionar y optimizar sus rutas diarias de manera eficiente. El sistema incluye un backend robusto con Node.js y PostgreSQL, ofreciendo una solución integral para la gestión de rutas.

### 🎯 Objetivo Principal

Proporcionar una herramienta intuitiva y eficiente para la planificación de rutas diarias, optimizando el tiempo y los recursos de desplazamiento de los usuarios, ideal para profesionales de delivery, vendedores, transportistas, o cualquier persona que necesite organizar sus trayectos cotidianos.

## ✨ Características Principales

### 🔐 **Sistema de Autenticación**
- Registro seguro con validación de datos
- Login con JWT tokens
- Gestión de sesiones persistentes
- Cambio de contraseña
- Perfil de usuario personalizable

### 🗺️ **Gestión de Mapas y Rutas**
- Visualización interactiva con React Native Maps
- Soporte para Google Maps (Android) y Apple Maps (iOS)
- Creación de rutas con múltiples waypoints
- Cálculo automático de distancias
- Edición y duplicación de rutas existentes
- Organización por días de la semana

### 📊 **Dashboard y Estadísticas**
- Panel principal con resumen diario
- Estadísticas de rutas (total, activas, distancia recorrida)
- Rutas del día con horarios
- Acciones rápidas
- Motivación diaria personalizada

### 🎨 **Interfaz de Usuario**
- Diseño moderno y responsive
- Soporte para modo claro/oscuro/sistema
- Navegación intuitiva por tabs
- Animaciones fluidas
- Componentes reutilizables

### 💾 **Almacenamiento y Caché**
- Base de datos PostgreSQL
- Cache con Redis (opcional)
- AsyncStorage para datos locales
- Sincronización automática

## 🏗️ Arquitectura del Proyecto

### 📁 Estructura del Frontend

```
AppRutas/
├── 📱 app/                     # Navegación y pantallas (Expo Router)
│   ├── (auth)/                # Stack de autenticación
│   │   ├── _layout.tsx        # Layout del stack de auth
│   │   ├── login.tsx          # Pantalla de inicio de sesión
│   │   └── register.tsx       # Pantalla de registro
│   ├── (tabs)/                # Navegación principal por tabs
│   │   ├── _layout.tsx        # Configuración de tabs
│   │   ├── index.tsx          # Dashboard principal
│   │   ├── map.tsx            # Creación/edición de rutas
│   │   ├── routes.tsx         # Lista de rutas guardadas
│   │   └── profile.tsx        # Perfil de usuario
│   ├── _layout.tsx            # Layout raíz con ThemeProvider
│   └── index.tsx              # Punto de entrada
│
├── 🎨 components/              # Componentes reutilizables
│   ├── MapComponent.tsx       # Componente de mapa multiplataforma
│   ├── ThemeToggle.tsx        # Selector de tema
│   └── ui/                    # Componentes de UI
│
├── 🎣 hooks/                   # Custom hooks
│   ├── useTheme.tsx           # Hook de gestión de temas
│   └── useColorScheme.ts      # Hook de esquema de colores
│
├── 🎨 constants/               # Constantes y configuración
│   └── Colors.ts              # Paleta de colores para temas
│
├── 🔧 services/                # Servicios y APIs
│   └── api.ts                 # Cliente Axios configurado
│
├── 📸 screenshots/             # Capturas de pantalla
│   ├── login.jpg
│   ├── crearCuenta.jpg
│   ├── inicioApp.jpg
│   ├── mapsApp.jpg
│   ├── RutasApp.jpg
│   ├── perfilApp.jpg
│   └── temaApp.jpg
│
└── 📦 assets/                  # Recursos estáticos
```

### 📁 Estructura del Backend

```
backend/
├── 🚀 src/
│   ├── config/                # Configuración
│   │   ├── database.ts        # Conexión PostgreSQL
│   │   └── redis.ts           # Conexión Redis (opcional)
│   │
│   ├── controllers/           # Controladores
│   │   ├── auth.controller.ts # Autenticación
│   │   ├── routes.controller.ts # Gestión de rutas
│   │   └── user.controller.ts # Gestión de usuarios
│   │
│   ├── middlewares/           # Middlewares
│   │   ├── auth.middleware.ts # Autenticación JWT
│   │   ├── cache.middleware.ts # Cache con Redis
│   │   └── validation.middleware.ts # Validación de datos
│   │
│   ├── models/                # Modelos de datos
│   │   ├── Route.ts           # Modelo de rutas
│   │   └── User.ts            # Modelo de usuarios
│   │
│   ├── routes/                # Rutas de API
│   │   ├── auth.routes.ts     # /api/auth/*
│   │   ├── routes.routes.ts   # /api/routes/*
│   │   └── user.routes.ts     # /api/user/*
│   │
│   ├── types/                 # TypeScript types
│   │   └── index.ts           # Definiciones de tipos
│   │
│   ├── sql/                   # Scripts SQL
│   │   └── init.sql           # Inicialización de BD
│   │
│   └── index.ts               # Entrada principal del servidor
│
├── 📝 .env                     # Variables de entorno
├── 📦 package.json             # Dependencias del backend
└── ⚙️ tsconfig.json            # Configuración TypeScript
```

## 🛠️ Stack Tecnológico

### Frontend
- **React Native** (0.79.5) - Framework móvil multiplataforma
- **Expo** (~53.0.20) - Plataforma de desarrollo
- **TypeScript** (5.8.3) - Tipado estático
- **Expo Router** (~5.1.4) - Navegación basada en archivos
- **React Native Maps** (1.25.3) - Mapas nativos
- **AsyncStorage** (2.2.0) - Almacenamiento persistente
- **Axios** - Cliente HTTP
- **React Native Gesture Handler** - Gestos nativos
- **React Native Reanimated** - Animaciones de alto rendimiento

### Backend
- **Node.js** (v18+) - Runtime JavaScript
- **Express** (4.18.2) - Framework web
- **PostgreSQL** (14+) - Base de datos relacional
- **TypeScript** (5.3.3) - Tipado estático
- **JWT** (9.0.2) - Autenticación
- **Bcrypt** (5.1.1) - Encriptación de contraseñas
- **Redis** (opcional) - Cache en memoria
- **Nodemon** - Hot reload en desarrollo
- **Cors** - Control de acceso HTTP

## 📱 Funcionalidades por Pantalla

### 🔐 Autenticación
- **Login**: 
  - Validación de credenciales
  - Recordar sesión
  - Redirección automática
- **Registro**: 
  - Validación de campos en tiempo real
  - Requisitos de contraseña seguros
  - Confirmación de contraseña

### 📊 Dashboard (Pantalla Principal)
- Saludo personalizado según hora del día
- Widget de fecha y hora actual
- Estadísticas rápidas (rutas totales, activas, km recorridos)
- Rutas programadas para hoy
- Acciones rápidas (crear ruta, ver rutas, perfil, estadísticas)
- Consejo del día
- Botón de cambio de tema

### 🗺️ Mapa (Creación/Edición de Rutas)
- Mapa interactivo con ubicación actual
- Agregar waypoints tocando el mapa
- Nombrar y describir cada punto
- Reordenar y eliminar waypoints
- Configurar día y hora de la ruta
- Calcular distancia total automáticamente
- Guardar y actualizar rutas

### 📋 Mis Rutas
- Lista de todas las rutas guardadas
- Búsqueda por nombre o descripción
- Filtros por día de la semana
- Estado activo/inactivo
- Acciones: editar, duplicar, eliminar
- Vista previa de waypoints
- Información de distancia y tiempo

### 👤 Perfil
- Información personal del usuario
- Estadísticas detalladas
- Cambiar contraseña
- Cerrar sesión
- Eliminar cuenta

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- Expo CLI
- Git
- Android Studio (para Android) o Xcode (para iOS)

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/AppRutas.git
cd AppRutas
```

### 2️⃣ Configurar la Base de Datos

1. Crear base de datos PostgreSQL:
```sql
CREATE DATABASE apprutas;
```

2. Ejecutar script de inicialización:
```bash
cd backend
psql -U postgres -d apprutas -f src/sql/init.sql
```

### 3️⃣ Configurar el Backend

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Crear archivo de variables de entorno:
```bash
# Crear archivo .env en backend/
```

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/apprutas

# Puerto del servidor
PORT=5000

# JWT Secret
JWT_SECRET=tu_super_secreto_jwt_2024

# JWT Expiration
JWT_EXPIRES_IN=7d

# Entorno
NODE_ENV=development

# Configuración de Expo (cambia la IP a la de tu máquina)
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.100.4
```

3. Iniciar servidor:
```bash
npm run dev
```

### 4️⃣ Configurar el Frontend

1. Instalar dependencias:
```bash
# En la raíz del proyecto
npm install
```

2. Configurar IP del backend en `services/api.ts`:
```javascript
// Cambia la IP a la de tu máquina local
return 'http://192.168.100.4:5000/api';
```

3. Iniciar Expo:
```bash
npx expo start
```

### 5️⃣ Ejecutar en Dispositivos

#### Android
- **Opción 1**: Escanear código QR con Expo Go
- **Opción 2**: Presionar `a` en terminal para emulador
- **Opción 3**: `npx expo run:android` para build de desarrollo

#### iOS
- **Opción 1**: Escanear código QR con Expo Go
- **Opción 2**: Presionar `i` en terminal para simulador
- **Opción 3**: `npx expo run:ios` para build de desarrollo

## 🔧 Scripts Disponibles

### Frontend
```json
{
  "start": "expo start",           // Iniciar servidor de desarrollo
  "android": "expo start --android", // Abrir en Android
  "ios": "expo start --ios",       // Abrir en iOS
  "web": "expo start --web",       // Abrir en navegador
  "lint": "expo lint"              // Ejecutar linter
}
```

### Backend
```json
{
  "dev": "nodemon src/index.ts",   // Desarrollo con hot reload
  "build": "tsc",                  // Compilar TypeScript
  "start": "node dist/index.js"    // Producción
}
```

## 📊 Base de Datos

### Esquema Principal

#### Tabla `users`
```sql
- id (UUID) - Identificador único
- email (VARCHAR) - Email único
- password_hash (VARCHAR) - Contraseña encriptada
- full_name (VARCHAR) - Nombre completo
- phone (VARCHAR) - Teléfono opcional
- is_active (BOOLEAN) - Estado de la cuenta
- email_verified (BOOLEAN) - Verificación de email
- last_login (TIMESTAMP) - Último acceso
- created_at (TIMESTAMP) - Fecha de creación
- updated_at (TIMESTAMP) - Última actualización
- deleted_at (TIMESTAMP) - Soft delete
```

#### Tabla `routes`
```sql
- id (UUID) - Identificador único
- user_id (UUID) - Referencia al usuario
- name (VARCHAR) - Nombre de la ruta
- description (TEXT) - Descripción opcional
- day_of_week (INTEGER) - Día (0=Domingo, 6=Sábado)
- start_time (TIME) - Hora de inicio
- total_distance (DECIMAL) - Distancia en km
- is_active (BOOLEAN) - Estado activo/inactivo
- created_at (TIMESTAMP) - Fecha de creación
- updated_at (TIMESTAMP) - Última actualización
- deleted_at (TIMESTAMP) - Soft delete
```

#### Tabla `route_waypoints`
```sql
- id (UUID) - Identificador único
- route_id (UUID) - Referencia a la ruta
- name (VARCHAR) - Nombre del punto
- description (TEXT) - Descripción
- address (TEXT) - Dirección
- latitude (DECIMAL) - Coordenada latitud
- longitude (DECIMAL) - Coordenada longitud
- order_index (INTEGER) - Orden en la ruta
- waypoint_type (VARCHAR) - Tipo (start/stop/end)
- created_at (TIMESTAMP) - Fecha de creación
- updated_at (TIMESTAMP) - Última actualización
```

## 🔒 Seguridad

- ✅ **Contraseñas hasheadas** con Bcrypt (10 rounds)
- ✅ **Autenticación JWT** con expiración de 7 días
- ✅ **Validación de datos** en frontend y backend
- ✅ **Sanitización de inputs** para prevenir inyecciones
- ✅ **CORS configurado** para peticiones seguras
- ✅ **Variables de entorno** para credenciales sensibles
- ✅ **Soft delete** para preservar integridad de datos
- ✅ **Rate limiting** configurable (opcional)
- ✅ **HTTPS** en producción (recomendado)

## 📈 Optimizaciones

- **Cache con Redis** (opcional) para mejorar rendimiento
- **Índices de base de datos** para consultas rápidas
- **Lazy loading** de componentes
- **Memoización** de cálculos costosos
- **Debounce** en búsquedas
- **Paginación** en listas largas
- **Optimización de imágenes** con TinyPNG
- **Code splitting** con Expo Router

## 🧪 Testing

### Scripts de Prueba Disponibles

```bash
# Backend - Probar login y contraseñas
cd backend
node test-login.js

# Backend - Verificar rutas
node test-routes.js

# Backend - Resetear contraseña
node test-login.js reset email@example.com nuevaPassword
```

### Testing Manual
1. **Autenticación**: Verificar login/registro
2. **CRUD Rutas**: Crear, leer, actualizar, eliminar
3. **Mapas**: Agregar waypoints y calcular distancias
4. **Temas**: Cambiar entre claro/oscuro/sistema
5. **Responsive**: Probar en diferentes tamaños

## 🚢 Despliegue

### Backend (Recomendaciones)
- **Heroku**: Fácil configuración con PostgreSQL addon
- **Railway**: Despliegue automático desde GitHub
- **DigitalOcean**: Control total con Droplets
- **AWS EC2**: Escalable para producción empresarial
- **Render**: Free tier disponible

### Frontend
- **Expo EAS Build**: Compilación en la nube
- **Google Play Store**: 
  - Generar APK/AAB con `eas build`
  - Subir a Play Console
- **App Store**: 
  - Generar IPA con `eas build`
  - Subir con Transporter

### Variables de Entorno en Producción
```env
DATABASE_URL=postgresql://usuario:password@host:5432/apprutas
JWT_SECRET=secreto_seguro_produccion
NODE_ENV=production
REDIS_URL=redis://host:6379
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Estilo
- Usar TypeScript para nuevos archivos
- Seguir convención de nombres en camelCase
- Documentar funciones complejas
- Escribir tests para nuevas features

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🐛 Solución de Problemas Comunes

### El backend no conecta
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql status

# Verificar credenciales
psql -U postgres -d apprutas

# Revisar logs del backend
npm run dev
```

### Los mapas no funcionan
```bash
# Android: Verificar Google Maps API key
# iOS: Los mapas de Apple funcionan sin configuración

# Reinstalar dependencias de mapas
npm uninstall react-native-maps
npx expo install react-native-maps
```

### Error de red en dispositivo físico
```bash
# Verificar IP en services/api.ts
ipconfig # Windows
ifconfig # Mac/Linux

# Asegurarse de estar en la misma red WiFi
# Desactivar firewall temporalmente para pruebas
```

### AsyncStorage no persiste
```bash
# Limpiar cache
npx expo start -c

# Reinstalar AsyncStorage
npm uninstall @react-native-async-storage/async-storage
npx expo install @react-native-async-storage/async-storage
```

## 📊 Métricas del Proyecto

- **Líneas de código**: ~5,000+
- **Componentes React**: 15+
- **Endpoints API**: 12+
- **Tablas de BD**: 4
- **Tiempo de desarrollo**: 2-3 semanas
- **Plataformas soportadas**: iOS, Android

## 🎯 Roadmap Futuro

- [ ] **v1.1**: Notificaciones push para recordatorios
- [ ] **v1.2**: Compartir rutas entre usuarios
- [ ] **v1.3**: Modo offline completo
- [ ] **v1.4**: Exportación PDF/Excel
- [ ] **v1.5**: Integración con Google Calendar
- [ ] **v2.0**: Versión web completa

## 👥 Equipo de Desarrollo

- **Desarrollador Principal** - [Tu Nombre]
- **Stack**: React Native, Node.js, PostgreSQL
- **Ubicación**: Chiclayo, Perú 🇵🇪

## 📞 Contacto y Soporte

- **Email**: junioralvines1005@gmail.com
- **LinkedIn**: [Perfil](https://linkedin.com/in/tu-perfil)
- **Portfolio**: [portfolio.com](https://tu-portfolio.com)

## 🙏 Agradecimientos

- **Expo Team** por la excelente plataforma de desarrollo
- **React Native Community** por las bibliotecas y el soporte
- **PostgreSQL** por la base de datos robusta y confiable
- **Stack Overflow** por las soluciones a problemas complejos
- **Anthropic Claude** por la asistencia en el desarrollo
- Todos los **beta testers** que probaron la aplicación

---

<div align="center">

**Desarrollado con ❤️ en Chiclayo, Perú** 🇵🇪

<img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Estado-Producción-green?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Mantenido-Sí-green?style=for-the-badge"/>

**© 2025 AppRutas - Todos los derechos reservados**

</div>