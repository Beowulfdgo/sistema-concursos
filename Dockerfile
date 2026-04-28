FROM node:20-alpine

WORKDIR /app

# Copiar package.json del backend
COPY server/package*.json ./server/

# Instalar dependencias del backend
RUN cd server && npm install --production

# Instalar dependencias del cliente y hacer build
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copiar el resto del código del servidor
COPY server/ ./server/

# Crear directorio de uploads
RUN mkdir -p server/uploads/projects

# Cambiar al directorio del servidor
WORKDIR /app/server

CMD ["node", "server.js"]