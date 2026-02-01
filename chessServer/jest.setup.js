// Jest setup file to suppress verbose console logging during tests
// Only errors and warnings will be shown

// Check if verbose mode is enabled via environment variable
const verboseMode = process.env.TEST_VERBOSE === 'true';

if (!verboseMode) {
    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Suppress console.log, console.info, and console.debug during tests
    // This reduces noise while keeping error/warning visibility
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();

    // Keep console.error and console.warn visible for actual failures
    // console.error and console.warn remain unchanged

    // Restore original methods after all tests
    afterAll(() => {
        console.log = originalLog;
        console.info = originalInfo;
        console.debug = originalDebug;
    });
}

