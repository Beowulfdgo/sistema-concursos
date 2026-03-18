FROM node:20-alpine

# Directorio de trabajo base
WORKDIR /app

FROM node:20-alpine

WORKDIR /app

# Copiar package.json del backend
COPY server/package*.json ./server/

# Instalar dependencias del backend
RUN cd server && npm install --production

# Copiar el resto del código
COPY . .

# Crear directorio de uploads
RUN mkdir -p server/uploads/projects

# Cambiar al directorio del servidor
WORKDIR /app/server

CMD ["node", "server.js"]