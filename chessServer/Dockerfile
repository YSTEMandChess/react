FROM node:18.20.8-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 3001
CMD [ "node", "index.js" ]
