// Wrapper for async routes: wrap handler with asyncHandler(fn) to catch rejected promises
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
