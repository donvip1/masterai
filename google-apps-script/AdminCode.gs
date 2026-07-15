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

function setupAdminData() {
  setupSheet();
  const announcementSheet = getAdminAnnouncementSheet();

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

function handlePublicAnnouncements() {
  const announcements = readAdminAnnouncements(false);

  return jsonResponse({
    ok: true,
    announcements: announcements
  });
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
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminDeleteAnnouncement") {
    deleteAdminAnnouncement(payload.id);
    return jsonResponse(buildAdminOverview());
  }

  if (action === "adminUpdateStudent") {
    updateAdminStudent(payload);
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
    announcements: readAdminAnnouncements(true)
  };
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
