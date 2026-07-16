const ADMIN_ANNOUNCEMENT_SHEET = "Announcements";
const ADMIN_ANNOUNCEMENT_HEADERS = [
  "ID",
  "Label",
  "Title",
  "Detail",
  "Active",
  "Created At",
  "Updated At"
];
const ADMIN_ASSIGNMENT_SHEET = "Assignments";
const ADMIN_ASSIGNMENT_HEADERS = [
  "Assignment ID",
  "Project ID",
  "Module ID",
  "Module Title",
  "Title",
  "Summary",
  "Tools",
  "Difficulty",
  "Estimated Minutes",
  "Prompt",
  "Deliverable",
  "Steps",
  "Student ID",
  "Due Date",
  "Status",
  "Submission",
  "Student Note",
  "Assigned At",
  "Updated At"
];
const ADMIN_ATTENDANCE_SHEET = "Attendance";
const ADMIN_ATTENDANCE_HEADERS = [
  "Attendance ID",
  "Student ID",
  "Session ID",
  "Session Label",
  "Checked In At",
  "Status",
  "Source"
];
const ADMIN_AUDIT_SHEET = "Admin Audit";
const ADMIN_AUDIT_HEADERS = ["Timestamp", "Action", "Target", "Details"];
const ADMIN_OPERATIONS_SHEET = "Operations Log";
const ADMIN_OPERATIONS_HEADERS = ["Timestamp", "Operation", "Status", "Details"];

function setupAdminData() {
  setupSheet();
  const announcementSheet = getAdminAnnouncementSheet();
  getAdminAssignmentSheet();
  getAdminAttendanceSheet();
  getAdminAuditSheet();
  getAdminOperationsSheet();

  if (announcementSheet.getLastRow() < 2) {
    const now = new Date();
    announcementSheet.appendRow([
      "announcement-board",
      "Announcement Board",
      "Latest academy notices will be posted here.",
      "Check back for class reminders, deadlines, payment updates, and special announcements.",
      true,
      now,
      now
    ]);
    announcementSheet.appendRow([
      "batch-two",
      "Registration",
      "Batch 2 registration is open.",
      "New students should complete the registration form and watch for WhatsApp or email onboarding.",
      true,
      now,
      now
    ]);
  }
}

function setupOperationalTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "backupAcademyData") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("backupAcademyData")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  recordOperationalEvent("Backup schedule", "ready", "Daily backup trigger created for approximately 3 AM script time.");
}

function backupAcademyData() {
  try {
    const spreadsheet = getSpreadsheet();
    const folderName = CONFIG.ACADEMY_NAME + " Database Backups";
    const folders = DriveApp.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    const sourceFile = DriveApp.getFileById(spreadsheet.getId());
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd-HHmm");
    sourceFile.makeCopy(CONFIG.ACADEMY_NAME + " Backup " + timestamp, folder);
    trimOldBackups(folder, 30);
    recordOperationalEvent("Database backup", "success", "Spreadsheet backup created.");
  } catch (error) {
    recordOperationalEvent("Database backup", "error", error.message);
    try {
      MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, "Academy backup failed", "The daily academy database backup failed.\n\n" + error.message);
    } catch (mailError) {}
    throw error;
  }
}

function trimOldBackups(folder, limit) {
  const files = [];
  const iterator = folder.getFiles();
  while (iterator.hasNext()) files.push(iterator.next());
  files.sort(function(first, second) { return second.getDateCreated().getTime() - first.getDateCreated().getTime(); });
  files.slice(limit).forEach(function(file) { file.setTrashed(true); });
}

function getAdminOperationsSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ADMIN_OPERATIONS_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(ADMIN_OPERATIONS_SHEET);
  sheet.getRange(1, 1, 1, ADMIN_OPERATIONS_HEADERS.length).setValues([ADMIN_OPERATIONS_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function recordOperationalEvent(operation, status, details) {
  getAdminOperationsSheet().appendRow([new Date(), String(operation || ""), String(status || ""), String(details || "")]);
}

function handlePublicAnnouncements() {
  const announcements = readAdminAnnouncements(false);

  return jsonResponse({
    ok: true,
    announcements: announcements
  });
}

function handlePublicAssignments(studentId) {
  const normalizedStudentId = normalizeStudentId(studentId);

  if (!normalizedStudentId) {
    return jsonResponse({ ok: false, code: "STUDENT_ID_REQUIRED", message: "Student ID is required." });
  }

  const student = findStudentById(normalizedStudentId);

  if (!student) {
    return jsonResponse({ ok: false, code: "STUDENT_NOT_FOUND", message: "Student ID was not found." });
  }

  if (String(student["Registration Status"] || "").toLowerCase() === "suspended") {
    return jsonResponse({ ok: false, code: "STUDENT_SUSPENDED", message: "This Student ID has been suspended." });
  }

  return jsonResponse({ ok: true, assignments: readStudentAssignments(normalizedStudentId) });
}

function handleAdminRequest(request) {
  verifyAdminApiKey(request.adminKey);
  const action = String(request.action || "");
  const payload = request.payload || {};

  if (action === "adminOverview") {
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminSaveAnnouncement") {
    saveAdminAnnouncement(payload);
    recordAdminAudit("Save announcement", payload.id || payload.title, payload.title);
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminDeleteAnnouncement") {
    deleteAdminAnnouncement(payload.id);
    recordAdminAudit("Delete announcement", payload.id, "");
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminUpdateStudent") {
    updateAdminStudent(payload);
    recordAdminAudit("Update student", payload.studentId, payload.operation);
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminBroadcastAssignment") {
    broadcastAdminAssignment(payload);
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminUpdateAssignment") {
    updateAdminAssignment(payload, true);
    recordAdminAudit("Update assignment", payload.assignmentId, payload.status);
    return jsonResponse(buildAdminOverview());
  }

  throw new Error("Unsupported admin action.");
}

function verifyAdminApiKey(providedKey) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("ADMIN_API_KEY");

  if (!expectedKey) {
    throw new Error("ADMIN_API_KEY is missing from Apps Script properties.");
  }

  if (String(providedKey || "") !== String(expectedKey)) {
    throw new Error("Admin database authorization failed.");
  }
}

function buildAdminOverview() {
  const students = readAdminStudents();
  const suspendedStudents = students.filter(function(student) {
    return String(student.registrationStatus || "").toLowerCase() === "suspended";
  }).length;
  const paidStudents = students.filter(function(student) {
    return String(student.paymentStatus || "").toLowerCase().indexOf("paid") >= 0;
  }).length;

  return {
    ok: true,
    summary: {
      totalStudents: students.length,
      activeStudents: students.length - suspendedStudents,
      suspendedStudents: suspendedStudents,
      paidStudents: paidStudents
    },
    students: students,
    announcements: readAdminAnnouncements(true),
    assignments: readAdminAssignments().slice(0, 500),
    attendance: readAdminAttendance()
  };
}

function getAdminAssignmentSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ADMIN_ASSIGNMENT_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ADMIN_ASSIGNMENT_SHEET);
  }

  sheet.getRange(1, 1, 1, ADMIN_ASSIGNMENT_HEADERS.length).setValues([ADMIN_ASSIGNMENT_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function broadcastAdminAssignment(payload) {
  const projectId = String(payload.projectId || "").trim();
  const studentIds = Array.isArray(payload.studentIds) ? payload.studentIds : [];
  const requestedRecipients = payload.broadcastToAll ? readAdminStudents().filter(function(student) {
    return String(student.registrationStatus || "").toLowerCase() !== "suspended";
  }).map(function(student) {
    return student.studentId;
  }) : studentIds.map(normalizeStudentId).filter(Boolean);
  const recipients = requestedRecipients.filter(function(studentId, index) {
    return requestedRecipients.indexOf(studentId) === index;
  });

  if (!projectId || !String(payload.title || "").trim() || !recipients.length) {
    throw new Error("Choose a project and at least one student recipient.");
  }

  const sheet = getAdminAssignmentSheet();
  const now = new Date();
  const baseId = projectId + "-" + now.getTime();
  const steps = Array.isArray(payload.steps) ? payload.steps.join("||") : String(payload.steps || "");
  const tools = Array.isArray(payload.tools) ? payload.tools.join(", ") : String(payload.tools || "");
  const rows = recipients.map(function(studentId) {
    return [
      baseId + "-" + studentId,
      projectId,
      String(payload.moduleId || ""),
      String(payload.moduleTitle || ""),
      String(payload.title || ""),
      String(payload.summary || ""),
      tools,
      String(payload.difficulty || ""),
      Number(payload.estimatedMinutes || 0),
      String(payload.prompt || ""),
      String(payload.deliverable || ""),
      steps,
      studentId,
      String(payload.dueDate || ""),
      "assigned",
      "",
      "",
      now,
      now
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, ADMIN_ASSIGNMENT_HEADERS.length).setValues(rows);
  recipients.forEach(function(studentId) {
    const student = findAdminStudentRow(studentId);
    if (student) {
      try {
        sendAssignmentNotice(student.record, payload);
      } catch (error) {
        recordAdminAudit("Assignment email failed", studentId, error.message);
      }
    }
  });
  recordAdminAudit("Broadcast assignment", projectId, recipients.join(", "));
}

function updateAdminAssignment(payload, adminRequest) {
  const assignment = findAssignmentRow(payload.assignmentId);

  if (!assignment || normalizeStudentId(assignment.record["Student ID"]) !== normalizeStudentId(payload.studentId)) {
    throw new Error("Assignment was not found for this student.");
  }

  const status = String(payload.status || "");
  const allowedStatuses = adminRequest
    ? ["assigned", "in-progress", "submitted", "completed"]
    : ["in-progress", "submitted"];

  if (allowedStatuses.indexOf(status) < 0) {
    throw new Error("Unsupported assignment status.");
  }

  const statusColumn = assignment.headers.indexOf("Status");
  const submissionColumn = assignment.headers.indexOf("Submission");
  const noteColumn = assignment.headers.indexOf("Student Note");
  const updatedColumn = assignment.headers.indexOf("Updated At");
  assignment.sheet.getRange(assignment.rowNumber, statusColumn + 1).setValue(status);
  assignment.sheet.getRange(assignment.rowNumber, submissionColumn + 1).setValue(String(payload.submission || ""));
  assignment.sheet.getRange(assignment.rowNumber, noteColumn + 1).setValue(String(payload.note || ""));
  assignment.sheet.getRange(assignment.rowNumber, updatedColumn + 1).setValue(new Date());
}

function readStudentAssignments(studentId) {
  return readAdminAssignments().filter(function(assignment) {
    return normalizeStudentId(assignment.studentId) === normalizeStudentId(studentId);
  });
}

function readAdminAssignments() {
  const sheet = getAdminAssignmentSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) { return String(header || ""); });
  return values.slice(1).filter(function(row) { return String(row[0] || ""); }).map(function(row) {
    const record = {};
    headers.forEach(function(header, index) { record[header] = displayCellValue(row[index]); });
    return {
      assignmentId: record["Assignment ID"] || "",
      projectId: record["Project ID"] || "",
      moduleId: record["Module ID"] || "",
      moduleTitle: record["Module Title"] || "",
      title: record.Title || "",
      summary: record.Summary || "",
      tools: record.Tools || "",
      difficulty: record.Difficulty || "",
      estimatedMinutes: record["Estimated Minutes"] || "",
      prompt: record.Prompt || "",
      deliverable: record.Deliverable || "",
      steps: String(record.Steps || "").split("||").filter(Boolean),
      studentId: record["Student ID"] || "",
      dueDate: record["Due Date"] || "",
      status: record.Status || "assigned",
      submission: record.Submission || "",
      note: record["Student Note"] || "",
      assignedAt: record["Assigned At"] || "",
      updatedAt: record["Updated At"] || ""
    };
  }).reverse();
}

function findAssignmentRow(assignmentId) {
  const sheet = getAdminAssignmentSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function(header) { return String(header || ""); });

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][0] || "") !== String(assignmentId || "")) continue;
    const record = {};
    headers.forEach(function(header, columnIndex) { record[header] = displayCellValue(values[index][columnIndex]); });
    return { sheet: sheet, rowNumber: index + 1, headers: headers, record: record };
  }

  return null;
}

function sendAssignmentNotice(student, payload) {
  const email = String(student["Email Address"] || "").trim();
  if (!email) return;
  const body = "Hello " + (student["Full Name"] || "student") + ",\n\n" +
    "A new practical assignment has been added to your EFF Academy dashboard.\n\n" +
    "Project: " + (payload.title || "") + "\n" +
    "Module: " + (payload.moduleTitle || "") + "\n" +
    "Due: " + (payload.dueDate || "No due date") + "\n\n" +
    "Open your Student Dashboard to view the steps and submit your work.\n\n" +
    "Everything for Free Academy";
  MailApp.sendEmail(email, "New practical assignment - " + CONFIG.ACADEMY_NAME, body);
}

function getAdminAttendanceSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ADMIN_ATTENDANCE_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(ADMIN_ATTENDANCE_SHEET);
  sheet.getRange(1, 1, 1, ADMIN_ATTENDANCE_HEADERS.length).setValues([ADMIN_ATTENDANCE_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function handleAttendanceCheckIn(payload) {
  const studentId = normalizeStudentId(payload.studentId);
  const student = findStudentById(studentId);
  if (!student) throw new Error("Student ID was not found.");
  if (String(student["Registration Status"] || "").toLowerCase() === "suspended") throw new Error("This Student ID has been suspended.");
  const sessionId = String(payload.sessionId || "").trim();
  if (!sessionId) throw new Error("A live class session is required.");
  if (!isAttendanceWindowOpen(sessionId)) throw new Error("Attendance check-in is only available during the live class window.");
  const sheet = getAdminAttendanceSheet();
  const values = sheet.getDataRange().getValues();
  const duplicate = values.slice(1).some(function(row) {
    return normalizeStudentId(row[1]) === studentId && String(row[2]) === sessionId;
  });
  if (!duplicate) {
    sheet.appendRow([sessionId + "-" + studentId, studentId, sessionId, String(payload.sessionLabel || "Live Class"), new Date(), "present", "dashboard"]);
  }
  return jsonResponse({ ok: true, checkedIn: true });
}

function isAttendanceWindowOpen(sessionId) {
  const now = new Date();
  const dateKey = Utilities.formatDate(now, "Africa/Lagos", "yyyy-MM-dd");
  const weekday = Utilities.formatDate(now, "Africa/Lagos", "EEE");
  const timeParts = Utilities.formatDate(now, "Africa/Lagos", "HH:mm").split(":");
  const currentMinutes = Number(timeParts[0]) * 60 + Number(timeParts[1]);
  const sessions = { morning: 10 * 60, evening: 16 * 60, night: 20 * 60 };
  const sessionName = String(sessionId || "").split("-")[0];
  const startMinutes = sessions[sessionName];

  if (["Mon", "Wed", "Fri"].indexOf(weekday) < 0 || startMinutes === undefined) return false;
  if (sessionId !== sessionName + "-" + dateKey) return false;
  return currentMinutes >= startMinutes - 10 && currentMinutes < startMinutes + 120;
}

function readAdminAttendance() {
  const sheet = getAdminAttendanceSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  return values.slice(1).reverse().slice(0, 100).map(function(row) {
    return {
      attendanceId: String(row[0] || ""),
      studentId: String(row[1] || ""),
      sessionId: String(row[2] || ""),
      sessionLabel: String(row[3] || ""),
      checkedInAt: displayCellValue(row[4]),
      status: String(row[5] || "present")
    };
  });
}

function getAdminAuditSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ADMIN_AUDIT_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(ADMIN_AUDIT_SHEET);
  sheet.getRange(1, 1, 1, ADMIN_AUDIT_HEADERS.length).setValues([ADMIN_AUDIT_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function recordAdminAudit(action, target, details) {
  getAdminAuditSheet().appendRow([new Date(), action, String(target || ""), String(details || "")]);
}

function readAdminStudents() {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header || "");
  });

  return values.slice(1).filter(function(row) {
    return String(row[headers.indexOf("Student ID")] || "").trim();
  }).map(function(row) {
    const record = {};

    headers.forEach(function(header, index) {
      record[header] = displayCellValue(row[index]);
    });

    return {
      studentId: record["Student ID"] || "",
      fullName: record["Full Name"] || "",
      registrationStatus: record["Registration Status"] || "",
      paymentStatus: record["Payment Status"] || "",
      paymentScreenshotUrl: record["Payment Screenshot URL"] || "",
      emailAddress: record["Email Address"] || "",
      phoneNumber: record["Phone Number"] || "",
      whatsappNumber: record["WhatsApp Number"] || "",
      country: record["Country"] || "",
      occupation: record["Occupation"] || "",
      learningInterests: record["Learning Interests"] || "",
      preferredSession: record["Preferred Session"] || "",
      courseCount: record["Course Count"] || "",
      courseFee: record["Course Fee"] || "",
      adminWarning: record["Admin Warning"] || "",
      adminNotes: record["Admin Notes"] || "",
      lastAdminAction: record["Last Admin Action"] || "",
      registeredAt: record["Timestamp"] || ""
    };
  }).reverse();
}

function updateAdminStudent(payload) {
  const operation = String(payload.operation || "");
  const rowDetails = findAdminStudentRow(payload.studentId);

  if (!rowDetails) {
    throw new Error("Student was not found.");
  }

  if (operation === "delete") {
    rowDetails.sheet.deleteRow(rowDetails.rowNumber);
    return;
  }

  const updates = {};
  const message = String(payload.message || "").trim();

  if (operation === "warn") {
    if (!message) {
      throw new Error("Enter a warning message.");
    }
    updates["Admin Warning"] = message;
    updates["Last Admin Action"] = "Warning issued " + new Date().toISOString();
  } else if (operation === "suspend") {
    updates["Registration Status"] = "Suspended";
    updates["Admin Notes"] = message || "Account suspended by academy admin.";
    updates["Last Admin Action"] = "Suspended " + new Date().toISOString();
  } else if (operation === "restore") {
    updates["Registration Status"] = "Active";
    updates["Admin Warning"] = "";
    updates["Admin Notes"] = "Account restored by academy admin.";
    updates["Last Admin Action"] = "Restored " + new Date().toISOString();
  } else if (operation === "approve") {
    updates["Registration Status"] = "Active";
    updates["Admin Notes"] = "Registration approved by academy admin.";
    updates["Last Admin Action"] = "Approved " + new Date().toISOString();
  } else if (operation === "markPaid") {
    updates["Payment Status"] = "Paid - Admin Confirmed";
    updates["Last Admin Action"] = "Payment confirmed " + new Date().toISOString();
  } else {
    throw new Error("Unsupported student action.");
  }

  Object.keys(updates).forEach(function(header) {
    const columnIndex = rowDetails.headers.indexOf(header);

    if (columnIndex >= 0) {
      rowDetails.sheet.getRange(rowDetails.rowNumber, columnIndex + 1).setValue(updates[header]);
    }
  });

  sendAdminStudentNotice(rowDetails.record, operation, message);
}

function findAdminStudentRow(studentId) {
  const normalizedId = normalizeStudentId(studentId);
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function(header) {
    return String(header || "");
  });
  const studentIdColumn = headers.indexOf("Student ID");

  for (let index = 1; index < values.length; index += 1) {
    if (normalizeStudentId(values[index][studentIdColumn]) !== normalizedId) {
      continue;
    }

    const record = {};
    headers.forEach(function(header, columnIndex) {
      record[header] = displayCellValue(values[index][columnIndex]);
    });

    return {
      sheet: sheet,
      rowNumber: index + 1,
      headers: headers,
      record: record
    };
  }

  return null;
}

function sendAdminStudentNotice(student, operation, message) {
  const email = String(student["Email Address"] || "").trim();

  if (!email) {
    return;
  }

  let subject = "Account update - " + CONFIG.ACADEMY_NAME;
  let body = "Hello " + (student["Full Name"] || "student") + ",\n\n";

  if (operation === "warn") {
    subject = "Important academy warning - " + CONFIG.ACADEMY_NAME;
    body += message;
  } else if (operation === "suspend") {
    subject = "Academy account suspended - " + CONFIG.ACADEMY_NAME;
    body += message || "Your student account has been suspended. Contact the academy admin for assistance.";
  } else if (operation === "restore") {
    subject = "Academy account restored - " + CONFIG.ACADEMY_NAME;
    body += "Your student account has been restored. You can continue using your Student ID dashboard.";
  } else if (operation === "approve") {
    subject = "Registration approved - " + CONFIG.ACADEMY_NAME;
    body += "Your academy registration has been approved. You can continue using your Student ID dashboard.";
  } else if (operation === "markPaid") {
    subject = "Payment confirmed - " + CONFIG.ACADEMY_NAME;
    body += "Your academy payment has been confirmed. Thank you.";
  }

  body += "\n\nStudent ID: " + (student["Student ID"] || "") + "\nContact: " + CONFIG.NOTIFICATION_EMAIL;
  MailApp.sendEmail(email, subject, body);
}

function getAdminAnnouncementSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(ADMIN_ANNOUNCEMENT_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ADMIN_ANNOUNCEMENT_SHEET);
  }

  sheet.getRange(1, 1, 1, ADMIN_ANNOUNCEMENT_HEADERS.length).setValues([ADMIN_ANNOUNCEMENT_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function readAdminAnnouncements(includeHidden) {
  const sheet = getAdminAnnouncementSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  return values.slice(1).map(function(row) {
    return {
      id: String(row[0] || ""),
      label: String(row[1] || ""),
      title: String(row[2] || ""),
      detail: String(row[3] || ""),
      active: String(row[4]).toLowerCase() !== "false",
      createdAt: displayCellValue(row[5]),
      updatedAt: displayCellValue(row[6])
    };
  }).filter(function(announcement) {
    return announcement.id && (includeHidden || announcement.active);
  }).reverse();
}

function saveAdminAnnouncement(payload) {
  const sheet = getAdminAnnouncementSheet();
  const id = String(payload.id || "announcement-" + Date.now());
  const label = String(payload.label || "").trim();
  const title = String(payload.title || "").trim();
  const detail = String(payload.detail || "").trim();
  const active = payload.active !== false;

  if (!label || !title || !detail) {
    throw new Error("Announcement label, title, and detail are required.");
  }

  const values = sheet.getDataRange().getValues();
  const now = new Date();

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][0]) === id) {
      sheet.getRange(index + 1, 1, 1, ADMIN_ANNOUNCEMENT_HEADERS.length).setValues([[
        id,
        label,
        title,
        detail,
        active,
        values[index][5] || now,
        now
      ]]);
      return;
    }
  }

  sheet.appendRow([id, label, title, detail, active, now, now]);
}

function deleteAdminAnnouncement(id) {
  const sheet = getAdminAnnouncementSheet();
  const values = sheet.getDataRange().getValues();

  for (let index = values.length - 1; index >= 1; index -= 1) {
    if (String(values[index][0]) === String(id || "")) {
      sheet.deleteRow(index + 1);
      return;
    }
  }

  throw new Error("Announcement was not found.");
}
