FROM node:18.20.8-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 8000
CMD [ "node", "server.js" ]
