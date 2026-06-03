/**
 * notFound — Catches requests to routes that do not exist.
 * Returns a 404 JSON response.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // Forward to global error handler
};

/**
 * errorHandler — Global error handler middleware.
 * Must have exactly 4 parameters for Express to treat it as an error handler.
 *
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const errorHandler = (err, req, res, next) => {
  // Determine HTTP status code
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let details = null;

  // ── Axios errors (external API communication failures) ───────────────────
  if (err.isAxiosError) {
    statusCode = err.response?.status || 502;
    message = "External API request failed";
    details = {
      url: err.config?.url,
      method: err.config?.method?.toUpperCase(),
      apiStatus: err.response?.status,
      apiMessage: err.response?.data?.message || err.response?.statusText,
    };
  }

  // ── Mongoose Validation errors ──────────────────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Data validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  }

  // ── Mongoose Duplicate Key errors ────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate record detected";
    details = err.keyValue;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err.stack || err.message);
  }

  return res.status(statusCode).json({
    success: false,
    message: details ? `${message}: ${JSON.stringify(details)}` : message,
  });
};
