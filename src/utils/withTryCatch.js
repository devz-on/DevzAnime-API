import { fail, success } from './response.js';
import { collectError } from '../workers/errorCollector.worker.js';

export default function withTryCatch(fn) {
  return async (c, next) => {
    try {
      const result = await fn(c, next);

      return success(c, result, null);
    } catch (error) {
      const statusCode = error?.statusCode || 500;
      const errorReport = collectError({
        source: 'route-handler',
        reason: statusCode >= 500 ? 'handler-error' : 'request-error',
        message: error?.message || 'route handler failed',
        method: c.req.method,
        path: c.req.path,
        statusCode,
        details: error?.details || null,
        stack: error?.stack || null,
      });

      console.error(error?.message || 'route handler failed');

      const normalizedDetails =
        error?.details && typeof error.details === 'object'
          ? { ...error.details, errorId: errorReport?.id || null }
          : errorReport?.id
            ? { errorId: errorReport.id }
            : error?.details || null;

      if (error?.statusCode) {
        return fail(c, error.message, error.statusCode, normalizedDetails);
      }
      return fail(c, error?.message || 'internal server error', 500, normalizedDetails);
    }
  };
}
