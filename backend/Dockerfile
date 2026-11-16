FROM node:22-slim AS base

RUN apt-get update && apt-get install -y openssl stockfish --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

COPY . .

COPY script/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["script/entrypoint.sh"]

# Production: compiled once, no file watcher, unprivileged user.
# Selected with `target: production` (docker-compose.prod.yml).
FROM base AS production

# NODE_PATH lets the compiled code resolve its `src/...` imports (dist/src/...).
ENV NODE_ENV=production NODE_PATH=/app/dist

RUN npx prisma generate && npm run build \
    && mkdir -p src/uploads && chown -R node:node /app

USER node

CMD ["node", "dist/src/main.js"]

# Development: must stay the last stage, it is what `docker compose up` builds by default.
FROM base AS development

CMD ["npm", "run", "start:dev"]
