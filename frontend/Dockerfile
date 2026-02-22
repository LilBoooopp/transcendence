FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Initialize submodules
RUN apk add --no-cache git
RUN git submodule update --init --recursive

CMD ["npm", "start"]
