FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

#instead of npm install. ci = clean install selon les versions du package-lock.json
RUN npm ci

COPY . .

CMD ["npm", "start"]
