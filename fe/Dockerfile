# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Construir la aplicación
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Crear un usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar carpetas y permisos
RUN mkdir -p /app/.next/cache/images && chown -R nextjs:nodejs /app

# Copiar archivos desde la etapa de construcción
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Usar el usuario no-root
USER nextjs

# Exponer el puerto 3000
EXPOSE 3000

# Iniciar la aplicación
CMD ["node", "server.js"]