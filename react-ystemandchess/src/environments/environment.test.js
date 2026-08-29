const fs = require('fs');
const path = require('path');
const { environment: dev } = require('./environment');

const PORTS = {
  middlewareURL: 8000,
  chessServerURL: 3001,
  chessClientURL: 3002,
  stockfishServerURL: 8080,
};

describe('Environment Configuration Invariants', () => {
  test.each(Object.entries(PORTS))('dev %s uses port %i', (key, port) => {
    expect(dev.urls[key]).toBe(`http://localhost:${port}`);
  });

  test('no temporary markers in committed development config', () => {
    const src = fs.readFileSync(path.join(__dirname, 'environment.js'), 'utf8');
    expect(src).not.toMatch(/for testing|TEMP|TODO|mock|XXX/i);
  });

  test('production environment throws in production mode if variables are missing', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.REACT_APP_MIDDLEWARE_URL;
      delete process.env.REACT_APP_STOCKFISH_SERVER_URL;
      delete process.env.REACT_APP_CHESS_SERVER_URL;
      delete process.env.REACT_APP_CHESS_CLIENT_URL;

      jest.resetModules();
      expect(() => {
        require('./environment.prod');
      }).toThrow(/Missing required production environment variable/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('production environment resolves properly when all variables are present', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      process.env.REACT_APP_MIDDLEWARE_URL = 'https://ystemandchess.com/middleware';
      process.env.REACT_APP_STOCKFISH_SERVER_URL = 'https://ystemandchess.com/stockfishserver';
      process.env.REACT_APP_CHESS_SERVER_URL = 'https://ystemandchess.com/chessserver';
      process.env.REACT_APP_CHESS_CLIENT_URL = 'https://ystemandchess.com/chessclient';

      jest.resetModules();
      const { environment: prod } = require('./environment.prod');
      expect(prod.production).toBe(true);
      expect(prod.urls.middlewareURL).toBe('https://ystemandchess.com/middleware');
      expect(prod.urls.chessServerURL).toBe('https://ystemandchess.com/chessserver');
      expect(prod.urls.chessClientURL).toBe('https://ystemandchess.com/chessclient');
      expect(prod.urls.stockfishServerURL).toBe('https://ystemandchess.com/stockfishserver');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
