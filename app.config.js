// app.config.js - Coloca este archivo en la raíz de tu proyecto
export default {
  expo: {
    name: "AppRutas",
    slug: "AppRutas",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "apprutas",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tuempresa.apprutas",
      config: {
        // Para iOS, si usas Google Maps en lugar de Apple Maps
        googleMapsApiKey: "TU_API_KEY_IOS_AQUI"
      }
    },
    android: {
      package: "com.tuempresa.apprutas",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ],
      config: {
        googleMaps: {
          // IMPORTANTE: Reemplaza esto con tu API Key real de Google Maps
          apiKey: "TU_API_KEY_ANDROID_AQUI"
        }
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Permitir a AppRutas acceder a tu ubicación para mostrar el mapa y crear rutas."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // Puedes agregar configuración adicional aquí
      eas: {
        projectId: "tu-project-id-aqui"
      }
    }
  }
};