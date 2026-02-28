//very basic logger
exports.info = (message) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
};

exports.error = (message) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
};