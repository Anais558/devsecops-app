FROM node:22-alpine

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copier uniquement dépendances
COPY package*.json ./

# Sécurité + reproductibilité CI/CD
RUN npm ci --ignore-scripts

# Copier le reste du projet
COPY src/ ./src/
COPY index.html ./
COPY vite.config.* ./
COPY tsconfig*.json ./

# permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173

# mode dev sécurisé
CMD ["npm", "run", "dev", "--", "--host"]
