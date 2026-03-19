FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

#instead of npm install. ci = clean install selon les versions du package-lock.json
RUN npm ci

COPY . .

ENV WDS_SOCKET_PORT=0

CMD ["npm", "start"]
