/**
 * Validators — per-entity validation based on real API field names
 */

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidDate = (value) => {
  if (!value) return true;
  const d = new Date(value);
  return !isNaN(d.getTime());
};

export const validateUser = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.userId)) errors.push("Missing or invalid userId");
  if (!isNonEmptyString(record.name))   errors.push("Missing or invalid name");
  if (!isNonEmptyString(record.email))  errors.push("Missing or invalid email");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (record.email && !emailRegex.test(record.email.trim())) {
    errors.push("Invalid email format");
  }
  return { valid: errors.length === 0, errors };
};

export const validateProject = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.projectId)) errors.push("Missing or invalid projectId");
  // Accept either 'name' or 'title' from API
  const projectName = record.name || record.title;
  if (!isNonEmptyString(projectName))      errors.push("Missing or invalid name");
  if (!isValidDate(record.startDate))      errors.push("Invalid startDate");
  if (!isValidDate(record.endDate))        errors.push("Invalid endDate");
  return { valid: errors.length === 0, errors };
};

export const validateIssue = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.issueId))   errors.push("Missing or invalid issueId");
  if (!isNonEmptyString(record.title))     errors.push("Missing or invalid title");
  if (!isNonEmptyString(record.projectId)) errors.push("Missing or invalid projectId");
  if (!isValidDate(record.resolvedAt))     errors.push("Invalid resolvedAt date");
  return { valid: errors.length === 0, errors };
};

export const validateAssignment = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.assignmentId)) errors.push("Missing or invalid assignmentId");
  if (!isNonEmptyString(record.issueId))      errors.push("Missing or invalid issueId");
  if (!isNonEmptyString(record.userId))       errors.push("Missing or invalid userId");
  return { valid: errors.length === 0, errors };
};

// API uses: commentId, issueId, userId, message
export const validateComment = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.commentId)) errors.push("Missing or invalid commentId");
  if (!isNonEmptyString(record.issueId))   errors.push("Missing or invalid issueId");
  if (!isNonEmptyString(record.userId))    errors.push("Missing or invalid userId");
  if (!isNonEmptyString(record.message))   errors.push("Missing or empty message");
  return { valid: errors.length === 0, errors };
};

// API uses: logId, issueId, userId, action, previousStatus, newStatus, timestamp
export const validateActivityLog = (record) => {
  const errors = [];
  if (!isNonEmptyString(record.logId))  errors.push("Missing or invalid logId");
  if (!isNonEmptyString(record.issueId)) errors.push("Missing or invalid issueId");
  if (!isNonEmptyString(record.action)) errors.push("Missing or invalid action");
  return { valid: errors.length === 0, errors };
};

// Dispatcher — maps API key to the right validator
export const validateRecord = (type, record) => {
  const validatorMap = {
    users:          validateUser,
    projects:       validateProject,
    issues:         validateIssue,
    assignments:    validateAssignment,
    comments:       validateComment,
    activities_log: validateActivityLog,
    activityLogs:   validateActivityLog,
    activitylogs:   validateActivityLog,
  };

  const validator = validatorMap[type];
  if (!validator) {
    return { valid: false, errors: [`Unknown entity type: ${type}`] };
  }
  return validator(record);
};
