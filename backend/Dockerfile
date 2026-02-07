FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]

# LATER PRODUCTION VERSION
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=development /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main"]
