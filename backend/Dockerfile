FROM node:22-alpine

RUN apk update && apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

COPY . .

COPY script/entrypoint.sh /urs/local/bin/
RUN chmod +x /urs/local/bin/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["script/entrypoint.sh"]

CMD ["npm", "run", "start:dev"]
