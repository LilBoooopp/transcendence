FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

#a retirer... ou plus précis...
COPY . .

COPY script/entrypoint.sh /urs/local/bin/
RUN chmod +x /urs/local/bin/entrypoint.sh

ENTRYPOINT ["script/entrypoint.sh"]

CMD ["npm", "run", "start:dev"]
