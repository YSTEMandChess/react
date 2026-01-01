import "@testing-library/jest-dom";

const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.alert = jest.fn();

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
