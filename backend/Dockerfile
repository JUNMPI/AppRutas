FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt y pg
RUN apk add --no-cache python3 make g++ postgresql-client

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 5000

# Comando para desarrollo
CMD ["npm", "run", "dev"]