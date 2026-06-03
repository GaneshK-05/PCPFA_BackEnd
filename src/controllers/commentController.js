import Comment from "../models/Comment.js";
import Issue from "../models/Issue.js";
import mongoose from "mongoose";

// @desc    Get comments for an issue (nested route)
// @route   GET /api/issues/:issueId/comments
// @access  Private
export const getComments = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    let issueQuery = { issueId };
    if (mongoose.Types.ObjectId.isValid(issueId)) {
      issueQuery = { $or: [{ _id: issueId }, { issueId }] };
    }

    const issue = await Issue.findOne(issueQuery);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Find comments matching the issueId string or issue ObjectId
    const comments = await Comment.find({
      $or: [{ issueId: issue.issueId }, { issue: issue._id }]
    })
      .populate("user", "-password")
      .populate("issue")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to an issue (nested route)
// @route   POST /api/issues/:issueId/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Comment message is required" });
    }

    let issueQuery = { issueId };
    if (mongoose.Types.ObjectId.isValid(issueId)) {
      issueQuery = { $or: [{ _id: issueId }, { issueId }] };
    }

    const issue = await Issue.findOne(issueQuery);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const count = await Comment.countDocuments();
    const commentId = `COM${1000 + count + 1}`;

    const comment = await Comment.create({
      commentId,
      issueId: issue.issueId,
      userId: req.user.userId,
      message,
      issue: issue._id,
      user: req.user._id,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "-password")
      .populate("issue");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all comments (standalone)
// @route   GET /api/comments
// @access  Private
export const getAllComments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.issueId) {
      let issueId = req.query.issueId;
      if (mongoose.Types.ObjectId.isValid(issueId)) {
        filter.$or = [{ issue: issueId }, { issueId: issueId }];
      } else {
        filter.issueId = issueId;
      }
    }
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const comments = await Comment.find(filter)
      .populate("user", "-password")
      .populate("issue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single comment by ID (standalone)
// @route   GET /api/comments/:id
// @access  Private
export const getCommentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { commentId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { commentId: id }] };
    }

    const comment = await Comment.findOne(query)
      .populate("user", "-password")
      .populate("issue");

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment fetched successfully",
      data: comment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create standalone comment
// @route   POST /api/comments
// @access  Private
export const createCommentStandalone = async (req, res, next) => {
  try {
    const { issueId, message } = req.body;

    if (!issueId || !message) {
      return res.status(400).json({
        success: false,
        message: "Both issueId and message are required",
      });
    }

    let issueQuery = { issueId };
    if (mongoose.Types.ObjectId.isValid(issueId)) {
      issueQuery = { $or: [{ _id: issueId }, { issueId }] };
    }

    const issue = await Issue.findOne(issueQuery);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const count = await Comment.countDocuments();
    const commentId = `COM${1000 + count + 1}`;

    const comment = await Comment.create({
      commentId,
      issueId: issue.issueId,
      userId: req.user.userId,
      message,
      issue: issue._id,
      user: req.user._id,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "-password")
      .populate("issue");

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete single comment by ID (standalone)
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteCommentStandalone = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { commentId: id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { commentId: id }] };
    }

    const comment = await Comment.findOneAndDelete(query);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: comment,
    });
  } catch (err) {
    next(err);
  }
};
