export const environment = {
	production: false,
	agora: {
		appId: process.env.REACT_APP_AGORA_APP_ID || '6b7772f2a76f406192d8167460181be0',
	},
	urls: {
		middlewareURL: process.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost:8000',
		chessServerURL: process.env.REACT_APP_CHESS_SERVER_URL || 'http://localhost:3001',
		chessClientURL: process.env.REACT_APP_CHESS_CLIENT_URL || 'http://localhost:3002',
		stockfishServerURL: process.env.REACT_APP_STOCKFISH_SERVER_URL || 'http://localhost:8080',
	},
	productionType: 'development', // development/production
};