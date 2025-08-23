FROM node:18-alpine

# Instalar git (necesario para algunas dependencias)
RUN apk add --no-cache git

WORKDIR /app

# Instalar Expo CLI
RUN npm install -g @expo/cli

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Puertos
EXPOSE 8081 19000

# Mostrar instrucciones y abrir shell interactivo
CMD ["sh", "-c", "echo '🚀 Proyecto listo!' && echo '📱 Ejecuta: npx expo start --tunnel' && echo '🌐 Backend en: http://host.docker.internal:5000' && echo '' && exec sh"]