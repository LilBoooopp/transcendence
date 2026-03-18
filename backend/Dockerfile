FROM node:22-slim

RUN apt-get update && apt-get install -y openssl stockfish --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

COPY . .

COPY script/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["script/entrypoint.sh"]

CMD ["npm", "run", "start:dev"]
