FROM node:22-alpine

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Sécurité + reproductibilité CI/CD
RUN npm ci --omit=dev --ignore-scripts

COPY src/ ./src/

# Changer le propriétaire
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["node", "src/index.js"]
