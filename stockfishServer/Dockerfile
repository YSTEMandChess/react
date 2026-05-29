FROM node:18.20.8-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN chmod +x /usr/src/app/src/bin/stockfish_11_linux

EXPOSE 9324
CMD [ "node", "src/index.js" ]
