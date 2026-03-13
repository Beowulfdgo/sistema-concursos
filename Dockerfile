FROM node:20-alpine

# Directorio de trabajo base
WORKDIR /app

# Copiar solo los package*.json del backend para aprovechar cache de Docker
COPY server/package*.json ./server/

# Instalar dependencias del backend
WORKDIR /app/server
RUN npm install --production

# Volver al root y copiar todo el código
WORKDIR /app
COPY server ./server
COPY client ./client

# Asegurar que exista el directorio de uploads de PDFs
RUN mkdir -p /app/server/uploads/projects

# Variables de entorno por defecto (puedes sobreescribirlas con docker run / compose)
ENV NODE_ENV=production \
    PORT=5000

# Exponer el puerto del backend
EXPOSE 5000

# Entrar al backend y levantar el servidor como en el README (node server.js)
WORKDIR /app/server
CMD ["node", "server.js"]