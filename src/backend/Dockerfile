FROM node:20-alpine

WORKDIR /app

RUN npm install -g @nestjs/cli

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
