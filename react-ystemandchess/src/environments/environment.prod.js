// Production environment config.
//
// Create React App injects REACT_APP_* variables at build time.
// Production builds must provide all service URLs explicitly.

const requiredProductionEnv = (name) => {
	const value = process.env[name];

	if (process.env.NODE_ENV === 'production' && !value) {
		throw new Error(`Missing required production environment variable: ${name}`);
	}

	return value || '';
};

export const environment = {
	production: true,
	agora: {
		appId: process.env.REACT_APP_AGORA_APP_ID || '',
	},
	urls: {
		// No trailing slash. Consumers append their own route paths.
		middlewareURL: requiredProductionEnv('REACT_APP_MIDDLEWARE_URL'),
		stockfishServerURL: requiredProductionEnv('REACT_APP_STOCKFISH_SERVER_URL'),
		chessServerURL: requiredProductionEnv('REACT_APP_CHESS_SERVER_URL'),
		chessClientURL: requiredProductionEnv('REACT_APP_CHESS_CLIENT_URL'),
	},
	productionType: 'production',
};
