FROM node:18.16.0-alpine

WORKDIR /api

# Copiar solo los archivos de dependencias primero
COPY package.json package-lock.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

EXPOSE 3001

CMD ["node", "index.js"]