FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del backend
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Instalar dependencias del cliente y hacer build
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copiar el resto del código
COPY . .

# Crear directorio de uploads
RUN mkdir -p server/uploads/projects

WORKDIR /app/server

CMD ["node", "server.js"]
