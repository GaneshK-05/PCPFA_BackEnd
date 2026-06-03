import axios from "axios";
import { validateRecord } from "../utils/validator.js";
import { sanitizeRecord } from "../utils/sanitizer.js";

import User from "../models/User.js";
import Project from "../models/Project.js";
import Issue from "../models/Issue.js";
import Assignment from "../models/Assignment.js";
import Comment from "../models/Comment.js";
import ActivityLog from "../models/ActivityLog.js";

// Maps every API key to its Mongoose model and unique field for dedup checks
// activities_log is the actual key returned by the API (not activityLogs)
const ENTITY_CONFIG = {
  users:          { model: User,        uniqueField: "userId"       },
  projects:       { model: Project,     uniqueField: "projectId"    },
  issues:         { model: Issue,       uniqueField: "issueId"      },
  assignments:    { model: Assignment,  uniqueField: "assignmentId" },
  comments:       { model: Comment,     uniqueField: "commentId"    },
  activities_log: { model: ActivityLog, uniqueField: "logId"        },
  activityLogs:   { model: ActivityLog, uniqueField: "logId"        },
  activitylogs:   { model: ActivityLog, uniqueField: "logId"        },
};

/**
 * fetchDataset
 * Step 1 — POST credentials to get JWT + dataUrl
 * Step 2 — GET private dataset with Bearer token
 */
const fetchDataset = async () => {
  const BASE_URL = process.env.BASE_URL;

  console.log("Authenticating with external API...");
  console.log(`Credentials => studentId: ${process.env.STUDENT_ID} | set: ${process.env.SET_NAME}`);

  const tokenResponse = await axios.post(`${BASE_URL}/public/token`, {
    studentId: process.env.STUDENT_ID,
    password:  process.env.PASSWORD,
    set:       process.env.SET_NAME,
  });

  const { token, dataUrl } = tokenResponse.data;

  if (!token || !dataUrl) {
    throw new Error("Authentication failed: token or dataUrl missing from response.");
  }

  console.log(`Token received. Fetching dataset from: ${BASE_URL}${dataUrl}`);

  const dataResponse = await axios.get(`${BASE_URL}${dataUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Unwrap API envelope — data is nested under a 'data' key
  const raw = dataResponse.data;
  const dataset = raw.data !== undefined ? raw.data : raw;

  if (!dataset) {
    throw new Error("Dataset fetch failed: empty response body.");
  }

  const shape = Array.isArray(dataset)
    ? `Array with ${dataset.length} items`
    : `Object with keys: [${Object.keys(dataset).join(", ")}]`;
  console.log(`Dataset fetched successfully. Shape => ${shape}`);

  return dataset;
};

/**
 * processEntityCollection
 * Steps 3–7 — validate, sanitize, dedup, insert for one entity collection
 */
const processEntityCollection = async (entityType, records) => {
  const config = ENTITY_CONFIG[entityType];

  if (!config) {
    console.warn(`Unknown entity type "${entityType}" — skipping.`);
    return { inserted: 0, duplicates: 0, rejected: records.length };
  }

  const { model, uniqueField } = config;
  let inserted  = 0;
  let duplicates = 0;
  let rejected  = 0;

  for (const rawRecord of records) {
    // Step 4: Validate
    const { valid, errors } = validateRecord(entityType, rawRecord);
    if (!valid) {
      console.warn(`[${entityType}] Rejected — ${errors.join(", ")}`, rawRecord);
      rejected++;
      continue;
    }

    // Step 5: Sanitize
    const sanitized = sanitizeRecord(entityType, rawRecord);

    // Step 6: Duplicate check
    const uniqueValue = sanitized[uniqueField];
    const exists = await model.findOne({ [uniqueField]: uniqueValue });
    if (exists) {
      duplicates++;
      continue;
    }

    // Step 7: Insert into MongoDB
    try {
      await model.create(sanitized);
      inserted++;
    } catch (dbError) {
      if (dbError.code === 11000) {
        duplicates++;
      } else {
        console.error(`[${entityType}] DB insert error for ${uniqueField}="${uniqueValue}":`, dbError.message);
        rejected++;
      }
    }
  }

  console.log(`[${entityType}] inserted=${inserted} | duplicates=${duplicates} | rejected=${rejected}`);
  return { inserted, duplicates, rejected };
};

/**
 * syncData — Main orchestrator
 * Accepts optional dataset parameter. If not provided, fetches from API.
 * Called by the sync controller on POST /sync OR by server.js on startup
 * @param {Object} dataset - Optional pre-fetched dataset to process
 */
export const syncData = async (dataset = null) => {
  let totalFetched    = 0;
  let totalInserted   = 0;
  let totalDuplicates = 0;
  let totalRejected   = 0;

  // If dataset not provided, fetch it from the API
  if (!dataset) {
    dataset = await fetchDataset();
  }

  // Build entityMap — dataset is an object keyed by entity type
  let entityMap = {};
  if (Array.isArray(dataset)) {
    dataset.forEach((record) => {
      const type = record.type || record.entityType || "unknown";
      if (!entityMap[type]) entityMap[type] = [];
      entityMap[type].push(record);
    });
  } else if (typeof dataset === "object") {
    entityMap = dataset;
  }

  for (const [entityType, records] of Object.entries(entityMap)) {
    if (!Array.isArray(records) || records.length === 0) continue;

    totalFetched += records.length;
    console.log(`Processing [${entityType}] — ${records.length} records`);

    const stats = await processEntityCollection(entityType, records);

    totalInserted   += stats.inserted;
    totalDuplicates += stats.duplicates;
    totalRejected   += stats.rejected;
  }

  // Resolve ObjectId relationships after syncing
  console.log("Resolving Mongoose ObjectID relationships...");
  await resolveMongooseRelationships();

  return {
    success: true,
    totalFetched,
    inserted:   totalInserted,
    duplicates: totalDuplicates,
    rejected:   totalRejected,
  };
};

/**
 * resolveMongooseRelationships
 * Resolves all raw string IDs to MongoDB ObjectId references
 */
export const resolveMongooseRelationships = async () => {
  try {
    // 1. Resolve Issue relationships:
    // - project (ref Project) from projectId (string)
    // - reportedBy (ref User) from reporterId (string)
    // - assignedTo (ref User) from Assignment
    const issues = await Issue.find();
    for (const issue of issues) {
      let modified = false;

      // Project reference
      if (issue.projectId) {
        const projectDoc = await Project.findOne({ projectId: issue.projectId });
        if (projectDoc && (!issue.project || issue.project.toString() !== projectDoc._id.toString())) {
          issue.project = projectDoc._id;
          modified = true;
        }
      }

      // Reporter reference
      if (issue.reporterId) {
        const reporterDoc = await User.findOne({ userId: issue.reporterId });
        if (reporterDoc && (!issue.reportedBy || issue.reportedBy.toString() !== reporterDoc._id.toString())) {
          issue.reportedBy = reporterDoc._id;
          modified = true;
        }
      }

      // Assigned user reference
      const activeAssignment = await Assignment.findOne({ issueId: issue.issueId, status: "active" });
      if (activeAssignment) {
        const devDoc = await User.findOne({ userId: activeAssignment.userId });
        if (devDoc && (!issue.assignedTo || issue.assignedTo.toString() !== devDoc._id.toString())) {
          issue.assignedTo = devDoc._id;
          modified = true;
        }
      }

      if (modified) {
        await issue.save();
      }
    }

    // 2. Resolve Comment relationships:
    // - issue (ref Issue) from issueId (string)
    // - user (ref User) from userId (string)
    const comments = await Comment.find();
    for (const comment of comments) {
      let modified = false;

      if (comment.issueId) {
        const issueDoc = await Issue.findOne({ issueId: comment.issueId });
        if (issueDoc && (!comment.issue || comment.issue.toString() !== issueDoc._id.toString())) {
          comment.issue = issueDoc._id;
          modified = true;
        }
      }

      if (comment.userId) {
        const userDoc = await User.findOne({ userId: comment.userId });
        if (userDoc && (!comment.user || comment.user.toString() !== userDoc._id.toString())) {
          comment.user = userDoc._id;
          modified = true;
        }
      }

      if (modified) {
        await comment.save();
      }
    }

    // 3. Resolve ActivityLog relationships:
    // - issue (ref Issue) from issueId (string)
    // - user (ref User) from userId (string)
    const logs = await ActivityLog.find();
    for (const log of logs) {
      let modified = false;

      if (log.issueId) {
        const issueDoc = await Issue.findOne({ issueId: log.issueId });
        if (issueDoc && (!log.issue || log.issue.toString() !== issueDoc._id.toString())) {
          log.issue = issueDoc._id;
          modified = true;
        }
      }

      if (log.userId) {
        const userDoc = await User.findOne({ userId: log.userId });
        if (userDoc && (!log.user || log.user.toString() !== userDoc._id.toString())) {
          log.user = userDoc._id;
          modified = true;
        }
      }

      if (modified) {
        await log.save();
      }
    }

    console.log("Mongoose ObjectID relationships resolved successfully.");
  } catch (error) {
    console.error("Error resolving Mongoose relationships:", error.message);
  }
};
