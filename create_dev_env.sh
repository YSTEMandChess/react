#!/bin/sh

cd react-ystemandchess/src
mkdir -p environments
printf "export const environment = {\n\tproduction: false,\n\tagora: {\n\t\tappId: '6b7772f2a76f406192d8167460181be0',\n\t},\n\turls: {\n\t\tmiddlewareURL: 'http://localhost:8000',\n\t\tchessClientURL: 'http://localhost',\n\t\tstockFishURL: 'http://localhost:8080/stockfishserver/',\n\t\tchessServer: 'http://localhost:3001/',\n\t},\n\tproductionType: 'development', // development/production\n};" > environments/environment.js
printf "export const environment = {\n\tproduction: false,\n\tagora: {\n\t\tappId: '6c368b93b82a4b3e9fb8e57da830f2a4',\n\t},\n\turls: {\n\t\tmiddlewareURL: 'http://localhost/middleware/',\n\t\tchessClientURL: 'http://localhost/chessclient/',\n\t\tstockFishURL: 'http://localhost/stockfishserver/',\n\t\tchessServer: 'http://localhost/chessserver/',\n\t},\n};" > environments/environment.prod.js


cd ../../middlewareNode/config
printf "{\n\t\"mongoURI\": \"mongodb+srv://userAdmin:l2W50UIqrscqWcXM@cluster0-rxbrl.mongodb.net/ystem?retryWrites=true&w=majority\",\n\t\"indexKey\": \"4F15D94B7A5CF347A36FC1D85A3B487D8B4F596FB62C51EFF9E518E433EA4C8C\",\n\t\"appID\": \"6b7772f2a76f406192d8167460181be0\",\n\t\"customerId\": \"23bf82ac5dbf438a9c25ab92bdd57918\",\n\t\"customerCertificate\": \"702f0dac91d9497a95ec0f14b70e65fb\",\n\t\"channel\": \"10000\",\n\t\"uid\": \"123\",\n\t\"awsAccessKey\": \"AKIA3W5HAAMIYEBGGVVF\",\n\t\"awsSecretKey\": \"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\",\n\t\"corsOptions\": {\n\t\t\"origin\": \"*\",\n\t\t\"methods\": [\"GET\", \"POST\", \"OPTIONS\", \"PUT\", \"DELETE\"],\n\t\t\"allowedHeaders\": [\"Origin\", \"X-Requested-With\", \"Content-Type\", \"Accept\", \"identity\", \"authorization\"],\n\t\t\"credentials\": true\n\t},\n\t\"basepath\": \"http://localhost:4200\",\n\t\"clientId\": \"63720075567-bebpkmcvvcq4u8uknhqaqgpnua7q6vv4.apps.googleusercontent.com\",\n\t\"clientSecret\": \"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\",\n\t\"redirectUri\": \"https://developers.google.com/oauthplayground\",\n\t\"refreshToken\": \"1//04rlOFcKqdnGxCgYIARAAGAQSNwF-L9IrrWBVBTj43iwJicMSiNDC8HeaQuMh8jKm6YuudLySpUZUWDWkEuzHAmXuJ0vE1LvnUro\",\n\t\"user\": \"khyati@ystemandchess.com\",\n\t\"senderEmail\": \"khyati@ystemandchess.com\"\n}" > default.json

cd ../../stockfishServer
printf "PORT=8080\n" > .env

cd ../chessServer
printf "PORT=3001\n" > .env

cd ../chessClient
printf "PARENT=*" > .env