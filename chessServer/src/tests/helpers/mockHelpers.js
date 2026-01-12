/**
 * Helper functions for creating mocks in tests
 */

/**
 * Creates a mock fetch that resolves with a successful Stockfish response
 */
function createMockStockfishFetch(responseData, options = {}) {
  const { delay = 0, status = 200 } = options;
  
  return jest.fn(() => {
    const promise = Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        return responseData;
      }
    });
    return promise;
  });
}

/**
 * Creates a mock fetch that rejects (for error testing)
 */
function createMockFetchReject(errorMessage, delay = 0) {
  return jest.fn(() => {
    const promise = Promise.reject(new Error(errorMessage));
    if (delay > 0) {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), delay);
      });
    }
    return promise;
  });
}

/**
 * Creates a mock fetch that times out
 */
function createMockFetchTimeout(delay = 7000) {
  return jest.fn(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const error = new Error("fetch timed out after 7000ms");
        error.name = "AbortError";
        reject(error);
      }, delay);
    });
  });
}

/**
 * Creates a mock OpenAI client
 */
function createMockOpenAIClient(responseContent, options = {}) {
  const { delay = 0, shouldReject = false, error = null } = options;
  
  return {
    chat: {
      completions: {
        create: jest.fn(async (params) => {
          if (shouldReject) {
            throw error || new Error("OpenAI API error");
          }
          
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          return {
            choices: [{
              message: {
                content: responseContent
              }
            }]
          };
        })
      }
    }
  };
}

module.exports = {
  createMockStockfishFetch,
  createMockFetchReject,
  createMockFetchTimeout,
  createMockOpenAIClient
};

