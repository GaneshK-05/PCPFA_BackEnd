/**
 * Sanitizers — clean and normalize raw API records before MongoDB insertion
 */

const safeString = (val) =>
  typeof val === "string" ? val.trim() : val != null ? String(val).trim() : "";

const safeLower = (val) => safeString(val).toLowerCase();

const safeDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const safeEnum = (val, defaultVal) => {
  const normalized = safeLower(val).replace(/\s+/g, "-");
  return normalized || defaultVal;
};

export const sanitizeUser = (record) => ({
  userId:   safeString(record.userId),
  name:     safeString(record.name),
  email:    safeLower(record.email),
  role:     safeEnum(record.role, "viewer"),
  isActive: record.isActive !== undefined ? Boolean(record.isActive) : true,
});

export const sanitizeProject = (record) => ({
  projectId:   safeString(record.projectId),
  name:        safeString(record.name || record.title),  // API uses 'title', model uses 'name'
  description: safeString(record.description),
  status:      safeEnum(record.status, "active"),
  ownerId:     safeString(record.owner || record.ownerId),  // API uses 'owner', map to 'ownerId'
  startDate:   safeDate(record.startDate),
  endDate:     safeDate(record.endDate),
});

export const sanitizeIssue = (record) => ({
  issueId:     safeString(record.issueId),
  title:       safeString(record.title),
  description: safeString(record.description),
  projectId:   safeString(record.projectId),
  reporterId:  safeString(record.reporterId),
  status:      safeEnum(record.status, "open"),
  priority:    safeEnum(record.priority, "medium"),
  type:        safeEnum(record.type, "bug"),
  version:     safeString(record.version),
  resolvedAt:  safeDate(record.resolvedAt),
});

export const sanitizeAssignment = (record) => ({
  assignmentId: safeString(record.assignmentId),
  issueId:      safeString(record.issueId),
  userId:       safeString(record.userId),
  assignedBy:   safeString(record.assignedBy),
  assignedAt:   safeDate(record.assignedAt) || new Date(),
  status:       safeEnum(record.status, "active"),
});

// API fields: commentId, issueId, userId, message, createdAt
export const sanitizeComment = (record) => ({
  commentId:       safeString(record.commentId),
  issueId:         safeString(record.issueId),
  userId:          safeString(record.userId),
  message:         safeString(record.message),
  parentCommentId: record.parentCommentId ? safeString(record.parentCommentId) : null,
  isDeleted:       record.isDeleted !== undefined ? Boolean(record.isDeleted) : false,
  createdAt:       safeDate(record.createdAt),
});

// API fields: logId, issueId, userId, action, previousStatus, newStatus, timestamp
export const sanitizeActivityLog = (record) => ({
  logId:          safeString(record.logId),
  issueId:        safeString(record.issueId),
  userId:         safeString(record.userId),
  action:         safeString(record.action).toLowerCase().trim(),
  previousStatus: safeString(record.previousStatus).toLowerCase().trim(),
  newStatus:      safeString(record.newStatus).toLowerCase().trim(),
  timestamp:      safeDate(record.timestamp) || new Date(),
});

// Dispatcher — maps API key to the right sanitizer
export const sanitizeRecord = (type, record) => {
  const sanitizerMap = {
    users:          sanitizeUser,
    projects:       sanitizeProject,
    issues:         sanitizeIssue,
    assignments:    sanitizeAssignment,
    comments:       sanitizeComment,
    activities_log: sanitizeActivityLog,
    activityLogs:   sanitizeActivityLog,
    activitylogs:   sanitizeActivityLog,
  };

  const sanitizer = sanitizerMap[type];
  return sanitizer ? sanitizer(record) : { ...record };
};
