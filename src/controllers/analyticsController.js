import Issue from "../models/Issue.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Get issue analytics (total, open, resolved, closed)
// @route   GET /api/analytics/issues
// @access  Private (Admin, Manager)
export const getIssueAnalytics = async (req, res, next) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          openIssues: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          resolvedIssues: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closedIssues: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        },
      },
    ]);

    const data = stats[0] || {
      totalIssues: 0,
      openIssues: 0,
      resolvedIssues: 0,
      closedIssues: 0,
    };

    res.status(200).json({
      success: true,
      message: "Issue analytics fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get project analytics (project-wise count, active, closed)
// @route   GET /api/analytics/projects
// @access  Private (Admin, Manager)
export const getProjectAnalytics = async (req, res, next) => {
  try {
    // Project-wise issue count
    const projectWiseIssueCount = await Issue.aggregate([
      {
        $group: {
          _id: "$projectId",
          issueCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "projectId",
          as: "projectInfo",
        },
      },
      {
        $project: {
          projectId: "$_id",
          projectName: { $ifNull: [{ $arrayElemAt: ["$projectInfo.name", 0] }, "$_id"] },
          issueCount: 1,
        },
      },
    ]);

    const activeProjectCount = await Project.countDocuments({ status: "active" });
    const closedProjectCount = await Project.countDocuments({
      status: { $in: ["completed", "inactive", "archived"] },
    });

    res.status(200).json({
      success: true,
      message: "Project analytics fetched successfully",
      data: {
        projectWiseIssueCount,
        activeProjectCount,
        closedProjectCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get developer analytics (developer resolved counts, avg resolution time, highest resolved)
// @route   GET /api/analytics/developers
// @access  Private (Admin, Manager)
export const getDeveloperAnalytics = async (req, res, next) => {
  try {
    const devStats = await Issue.aggregate([
      {
        $match: {
          status: "resolved",
          assignedTo: { $ne: null },
        },
      },
      {
        $project: {
          assignedTo: 1,
          resolutionTimeHours: {
            $divide: [
              { $subtract: ["$resolvedAt", "$createdAt"] },
              1000 * 60 * 60, // Convert milliseconds to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          resolvedCount: { $sum: 1 },
          avgResolutionTimeHours: { $avg: "$resolutionTimeHours" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "developerInfo",
        },
      },
      {
        $project: {
          developerId: "$_id",
          developerName: { $arrayElemAt: ["$developerInfo.name", 0] },
          developerEmail: { $arrayElemAt: ["$developerInfo.email", 0] },
          resolvedCount: 1,
          avgResolutionTimeHours: { $ifNull: ["$avgResolutionTimeHours", 0] },
        },
      },
      {
        $sort: { resolvedCount: -1 },
      },
    ]);

    const highestResolvedIssueCount = devStats.length > 0 ? devStats[0].resolvedCount : 0;

    res.status(200).json({
      success: true,
      message: "Developer analytics fetched successfully",
      data: {
        developerWiseResolvedIssueCount: devStats,
        highestResolvedIssueCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
