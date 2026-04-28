FROM node:22-alpine

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copie ciblée des fichiers nécessaires
COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY index.html ./
COPY vite.config.* ./
COPY tsconfig*.json ./

# Changer le propriétaire
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]