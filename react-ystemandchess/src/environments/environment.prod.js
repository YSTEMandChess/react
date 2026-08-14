// Production environment config.
//
// NOTE: the URL values below are placeholders carried over from the previous
// (unused) version of this file. They are NOT real production endpoints.
// A developer must confirm and replace them before this file is trusted for
// a real deploy. See recommendations.md, "Frontend production URLs".
//
// Values can be overridden at build time without editing this file, since
// Create React App inlines any REACT_APP_* env var automatically:
//   REACT_APP_MIDDLEWARE_URL=https://api.ystemandchess.com npm run build
export const environment = {
	production: true,
	agora: {
		appId: process.env.REACT_APP_AGORA_APP_ID || '6c368b93b82a4b3e9fb8e57da830f2a4',
	},
	urls: {
		// TODO(developer): confirm these are the real production endpoints.
		middlewareURL: process.env.REACT_APP_MIDDLEWARE_URL || 'http://localhost/middleware/',
		stockfishServerURL: process.env.REACT_APP_STOCKFISH_SERVER_URL || 'http://localhost/stockfishserver/',
		chessServerURL: process.env.REACT_APP_CHESS_SERVER_URL || 'http://localhost/chessserver/',
	},
	productionType: 'production',
};