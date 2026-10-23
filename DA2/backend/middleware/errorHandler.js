import { ApiError, toApiError } from '../utils/http.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `No route matches ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const apiError = toApiError(err);
  if (apiError.status >= 500) console.error('[API]', req.method, req.originalUrl, err);
  res.status(apiError.status).json({ success: false, error: apiError.message, details: apiError.details });
}

export function assertBody(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => req.body?.[f] === undefined || req.body?.[f] === null || req.body?.[f] === '');
    if (missing.length) return next(new ApiError(400, `Missing required field(s): ${missing.join(', ')}.`));
    next();
  };
}
