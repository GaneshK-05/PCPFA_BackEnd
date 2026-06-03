import ActivityLog from "../models/ActivityLog.js";
import Issue from "../models/Issue.js";

// @desc    Get activity logs for an issue
// @route   GET /api/issues/:issueId/logs
// @access  Private
export const getLogs = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findOne({ issueId });
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const logs = await ActivityLog.find({ issueId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
