import Project from "../models/Project.js";

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status.toLowerCase();
    }
    if (req.query.owner) {
      query.$or = [
        { ownerId: req.query.owner },
        { owner: req.query.owner }
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: projects,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ projectId: req.params.id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project fetched successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin, Manager)
export const createProject = async (req, res, next) => {
  try {
    // Generate a new projectId like PROJ1234
    const count = await Project.countDocuments();
    const projectId = `PROJ${1000 + count + 1}`;

    const project = await Project.create({
      ...req.body,
      projectId,
      ownerId: req.user.userId, // Assuming ownerId uses external ID
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Manager)
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { projectId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ projectId: req.params.id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
