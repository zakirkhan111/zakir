// Wraps async controller functions so errors are forwarded to the global error handler
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
