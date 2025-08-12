# PASO 1: Abre PowerShell o CMD en la carpeta de tu proyecto
# (Click derecho en la carpeta → "Abrir en Terminal" o "Open in Terminal")

# PASO 2: Ejecuta estos comandos UNO POR UNO

# Eliminar archivos que no necesitas (si existen)
del "app\(tabs)\explore.tsx" 2>nul
del "components\Collapsible.tsx" 2>nul
del "components\ExternalLink.tsx" 2>nul
del "components\HelloWave.tsx" 2>nul
del "components\HapticTab.tsx" 2>nul
del "components\ParallaxScrollView.tsx" 2>nul
del "components\ThemedText.tsx" 2>nul
del "components\ThemedView.tsx" 2>nul

# Eliminar más archivos
del "components\ui\IconSymbol.tsx" 2>nul
del "components\ui\TabBarBackground.tsx" 2>nul

# Limpiar node_modules (esto puede tardar)
rmdir /s /q node_modules 2>nul

# Eliminar package-lock
del package-lock.json 2>nul

# PASO 3: Crear carpeta hooks si no existe
mkdir hooks 2>nul

# PASO 4: Instalar dependencias
npm install