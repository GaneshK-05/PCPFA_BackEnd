import Issue from "../models/Issue.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import mongoose from "mongoose";

// Helper to create an activity log
const createLog = async (issueId, userId, action, previousStatus, newStatus) => {
  const count = await ActivityLog.countDocuments();
  const logId = `LOG${1000 + count + 1}`;

  const issue = await Issue.findOne({ issueId });
  const user = await User.findOne({ userId });

  await ActivityLog.create({
    logId,
    issueId,
    userId,
    action,
    previousStatus,
    newStatus,
    timestamp: new Date(),
    issue: issue?._id,
    user: user?._id,
  });
};

// @desc    Get all issues (supports pagination, priority, status, severity, and regex search)
// @route   GET /api/issues
// @access  Private
export const getIssues = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by project
    if (req.query.projectId) {
      if (mongoose.Types.ObjectId.isValid(req.query.projectId)) {
        query.$or = [{ project: req.query.projectId }, { projectId: req.query.projectId }];
      } else {
        query.projectId = req.query.projectId;
      }
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status.toLowerCase();
    }

    // Filter by priority or severity (severity mapped to priority)
    const priorityFilter = req.query.priority || req.query.severity;
    if (priorityFilter) {
      query.priority = priorityFilter.toLowerCase();
    }

    // Search query (case-insensitive regex on title and description)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Issues fetched successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: issues,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
export const getIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOne(query)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue fetched successfully",
      data: issue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create issue
// @route   POST /api/issues
// @access  Private
export const createIssue = async (req, res, next) => {
  try {
    const count = await Issue.countDocuments();
    const issueId = `ISS${1000 + count + 1}`;

    const { projectId } = req.body;
    let projectDoc = null;
    if (projectId) {
      let projectQuery = { projectId };
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        projectQuery = { $or: [{ _id: projectId }, { projectId }] };
      }
      projectDoc = await Project.findOne(projectQuery);
    }

    const issue = await Issue.create({
      ...req.body,
      issueId,
      projectId: projectDoc ? projectDoc.projectId : projectId,
      project: projectDoc ? projectDoc._id : null,
      reporterId: req.user.userId,
      reportedBy: req.user._id,
    });

    await createLog(issueId, req.user.userId, "created", "", issue.status);

    const populatedIssue = await Issue.findById(issue._id)
      .populate("project")
      .populate("reportedBy");

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: populatedIssue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update issue (PATCH / PUT)
// @route   PATCH /api/issues/:id
// @access  Private
export const updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Role verification: Developer can only update issues assigned to them
    if (req.user.role === "developer") {
      const isAssigned = issue.assignedTo &&
        (issue.assignedTo.toString() === req.user._id.toString() || issue.userId === req.user.userId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "Developers can only update issues assigned to them",
        });
      }
    }

    // Workflow Rule: Resolved & Closed issues cannot be edited (except by admin/manager)
    if ((issue.status === "resolved" || issue.status === "closed") &&
        req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(400).json({
        success: false,
        message: `${issue.status.charAt(0).toUpperCase() + issue.status.slice(1)} issues cannot be edited`,
      });
    }

    // If project is being updated, resolve reference
    if (req.body.projectId) {
      const projId = req.body.projectId;
      let projectQuery = { projectId: projId };
      if (mongoose.Types.ObjectId.isValid(projId)) {
        projectQuery = { $or: [{ _id: projId }, { projectId: projId }] };
      }
      const projectDoc = await Project.findOne(projectQuery);
      if (projectDoc) {
        issue.project = projectDoc._id;
        issue.projectId = projectDoc.projectId;
      }
    }

    Object.assign(issue, req.body);
    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy");

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: populatedIssue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change issue status
// @route   PATCH /api/issues/:id/status
// @access  Private (Admin, Manager, Developer)
export const updateIssueStatus = async (req, res, next) => {
  try {
    let { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    // Normalize in_progress to in-progress
    if (status === "in_progress") status = "in-progress";
    status = status.toLowerCase();

    // Check allowed statuses
    const allowedStatuses = ["open", "in-progress", "testing", "resolved", "closed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(", ")}`,
      });
    }

    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const previousStatus = issue.status;

    // Workflow Rule 1: Closed issues cannot move back
    if (previousStatus === "closed" && status !== "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed issues cannot move back",
      });
    }

    // Workflow Rule 2: Tester cannot close issues
    if (status === "closed" && req.user.role === "tester") {
      return res.status(403).json({
        success: false,
        message: "Tester cannot close issues",
      });
    }

    // Workflow Rule 3: Only assigned developer can move to testing
    if (status === "testing" && req.user.role !== "admin" && req.user.role !== "manager") {
      const isAssigned = issue.assignedTo &&
        (issue.assignedTo.toString() === req.user._id.toString() || issue.userId === req.user.userId);
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "Only the assigned developer can move issues to testing",
        });
      }
    }

    issue.status = status;
    if (status === "resolved") {
      issue.resolvedAt = new Date();
    }
    await issue.save();

    await createLog(issue.issueId, req.user.userId, "status_changed", previousStatus, status);

    const populatedIssue = await Issue.findById(issue._id)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy");

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      data: populatedIssue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change issue priority
// @route   PATCH /api/issues/:id/priority
// @access  Private (Admin, Manager)
export const updateIssuePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!priority) {
      return res.status(400).json({ success: false, message: "Priority is required" });
    }

    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    issue.priority = priority.toLowerCase();
    await issue.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy");

    res.status(200).json({
      success: true,
      message: "Issue priority updated successfully",
      data: populatedIssue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign issue to user
// @route   PATCH /api/issues/:id/assign
// @access  Private (Admin, Manager)
export const assignIssue = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required for assignment" });
    }

    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOne(query);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Workflow Rule: Closed issue cannot be assigned
    if (issue.status === "closed") {
      return res.status(400).json({ success: false, message: "Closed issue cannot be assigned" });
    }

    // Check if target user exists
    let userQuery = { userId };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userQuery = { $or: [{ _id: userId }, { userId }] };
    }
    const user = await User.findOne(userQuery);
    if (!user) {
      return res.status(404).json({ success: false, message: "Assigned user not found" });
    }

    issue.assignedTo = user._id;
    await issue.save();

    await createLog(issue.issueId, req.user.userId, "assigned", issue.status, issue.status);

    const populatedIssue = await Issue.findById(issue._id)
      .populate("project")
      .populate("assignedTo")
      .populate("reportedBy");

    res.status(200).json({
      success: true,
      message: `Issue assigned to ${user.name} successfully`,
      data: populatedIssue,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Admin)
export const deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { issueId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { issueId: id }] };
    }

    const issue = await Issue.findOneAndDelete(query);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
