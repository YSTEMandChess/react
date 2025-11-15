#!/bin/bash

printf "Creating environment files and variables\n\n"

#Creating environment files and variables for react-ystemandchess
printf "Creating environment files for react-ystemandchess\n"
cd react-ystemandchess/src && mkdir -p core/environments
cd core/environments

#Creating and adding environment.js file and variables
touch environment.js
printf "export const environment = {\n" >> environment.js
printf "    production: false,\n" >> environment.js
printf "      agora: {\n" >> environment.js
printf "     appId: ' ',\n" >> environment.js
printf "    },\n" >> environment.js
printf "    urls: {\n" >> environment.js
printf "      middlewareURL: 'http://127.0.0.1:8000',\n" >> environment.js
printf "      chessClientURL: 'http://localhost',\n" >> environment.js
printf "      stockFishURL : 'http://127.0.0.1:8080',\n" >> environment.js
printf "      chessServerURL : 'http://127.0.0.1:3000'\n" >> environment.js
printf "    }\n" >> environment.js
printf "  };\n" >> environment.js

#Creating and adding environment.prod.js file and environment variables
touch environment.prod.js
printf "export const environment = {\n" >> environment.prod.js
printf "    production: false,\n" >> environment.prod.js
printf "      agora: {\n" >> environment.prod.js
printf "     appId: ' ',\n" >> environment.prod.js
printf "    },\n" >> environment.prod.js
printf "    urls: {\n" >> environment.prod.js
printf "      middlewareURL: 'http://127.0.0.1:8000',\n" >> environment.prod.js
printf "      chessClientURL: 'http://localhost',\n" >> environment.prod.js
printf "      stockFishURL : 'http://127.0.0.1:8080',\n" >> environment.prod.js
printf "      chessServerURL : 'http://127.0.0.1:3000'\n" >> environment.prod.js
printf "    }\n" >> environment.prod.js
printf "  };\n" >> environment.prod.js

printf "react-ystemandchess env files completed!\n\n"

#Back to root
cd ../../..

#Creating environment files and variables for middleware
printf "Creating environment file and variables for middleware\n"

cd middleware

touch environment.php
printf "<?php\n" >> environment.php
printf "    \$_ENV[\"indexKey\"]=\" \";\n" >> environment.php
printf "    \$_ENV[\"key\"]=\" \";\n" >> environment.php
printf "    \$_ENV[\"secret\"]=' ';\n" >> environment.php
printf "    \$_ENV[\"mongoCredentials\"]=' ';\n" >> environment.php
printf "    \$_ENV[\"appID\"]=' ';\n" >> environment.php
printf "    \$_ENV[\"auth\"]=' ';\n" >> environment.php
printf "    \$_ENV[\"channel\"]=\"10000\";\n" >> environment.php
printf "    \$_ENV[\"uid\"]=\" \";\n" >> environment.php
printf "    \$_ENV[\"awsAccessKey\"]=\" \";\n" >> environment.php
printf "    \$_ENV[\"awsSecretKey\"]=\" \";\n" >> environment.php
printf " ?>\n" >> environment.php

printf "middleware environment file complete\n\n"

#Back to root
cd ..

#Create environment file for chessServer
printf "Creating environment files for chessServer\n"

cd chessServer

touch .env

printf "PORT=3000\n" >> .env

printf "chessServer environment files complete\n\n"

#Back to root
cd ..

#Creating environment files for chessClient
printf "Creating environment files for chessClient\n"

cd chessClient

touch .env

printf "PARENT = *\n" >> .env

printf "chessClient environment files complete\n\n"

#Back to root
cd ..

#Create environment files for stockfishServer
printf "Create environment files for stockfishServer\n\n"

cd stockfishServer

touch .env

printf "PORT=8080\n" >> .env

printf "stockfishServer environment files complete\n\n"

#Back to root
cd ..

printf "Environment files complete"