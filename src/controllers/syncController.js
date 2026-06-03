import { syncData } from "../services/syncService.js";

/**
 * handleSync — Controller for POST /sync
 *
 * Triggers the full data synchronization pipeline and responds
 * with aggregated statistics about the sync operation.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const handleSync = async (req, res, next) => {
  try {
    console.log("\nSync triggered via POST /sync");
    console.log(`Start time: ${new Date().toISOString()}`);

    // Delegate all business logic to the sync service
    const result = await syncData();

    console.log(`Sync complete at: ${new Date().toISOString()}`);
    console.log("Sync result:", result);

    // Respond with 200 OK and structured sync statistics
    return res.status(200).json(result);
  } catch (error) {
    // Forward unexpected errors to the global error handler middleware
    console.error("Sync controller caught error:", error.message);
    next(error);
  }
};
