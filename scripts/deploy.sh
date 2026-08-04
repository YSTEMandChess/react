#!/bin/bash
set -e

case "$1" in
  frontend)
    ~/scripts/deploy-frontend.sh
    ;;
  chess-server)
    ~/scripts/deploy-service.sh chess-server.service /home/azureuser/YSTEMandChess/react/chessServer 3001
    ;;
  chess-client)
    ~/scripts/deploy-service.sh chess-client.service /home/azureuser/YSTEMandChess/react/chessclient 3002
    ;;
  middleware)
    ~/scripts/deploy-service.sh middleware.service /home/azureuser/YSTEMandChess/react/middlewareNode 8000
    ;;
  stockfish-server)
    ~/scripts/deploy-service.sh stockfish-server.service /home/azureuser/YSTEMandChess/react/stockfishServer 8080
    ;;
  all)
    ~/scripts/deploy-frontend.sh
    ~/scripts/deploy-service.sh chess-server.service /home/azureuser/YSTEMandChess/react/chessServer 3001
    ~/scripts/deploy-service.sh chess-client.service /home/azureuser/YSTEMandChess/react/chessclient 3002
    ~/scripts/deploy-service.sh middleware.service /home/azureuser/YSTEMandChess/react/middlewareNode 8000
    ~/scripts/deploy-service.sh stockfish-server.service /home/azureuser/YSTEMandChess/react/stockfishServer 8080
    ;;
  *)
    echo "Usage: deploy.sh {frontend|chess-server|chess-client|middleware|stockfish-server|all}"
    exit 1
    ;;
esac
