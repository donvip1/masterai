const REPORT_CONFIG = {
  QUIZ_SPREADSHEET_ID: "1EDxb3GMWbtvhajmnHl15tsVm9wUFzGLwRzVEP394jBk",
  QUIZ_SHEET_NAME: "Module Quiz Submissions",
  REPORT_SHEET_NAME: "Module Reports",
  REGISTRATION_SPREADSHEET_ID: "1ZyoIUgUphrqp0gUeL49wPOWnHtktSwNFvhgh9oxcWnw",
  REGISTRATION_SHEET_NAME: "Registrations",
  DRIVE_ROOT_FOLDER: "Mastering AI Tools",
  DRIVE_REPORTS_FOLDER: "Student Reports",
  ACADEMY_NAME: "Everything for Free Academy"
};

const REPORT_HEADERS = [
  "Time Generated",
  "Completion Date",
  "Student ID",
  "Full Name",
  "Module ID",
  "Module Name",
  "Task Type",
  "Score",
  "Total Questions",
  "Percentage",
  "Result",
  "Question Breakdown",
  "PNG Report URL",
  "PNG Download URL",
  "PDF Report URL",
  "PDF Download URL",
  "WhatsApp Share URL",
  "Drive Folder",
  "Cycle",
  "Status",
  "Email Status",
  "Page URL"
];

function doGet() {
  return reportJsonResponse({
    ok: true,
    message: REPORT_CONFIG.ACADEMY_NAME + " module report endpoint is live."
  });
}

function doPost(e) {
  try {
    const payload = parseReportPayload(e);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);

    try {
      return saveModuleReport(payload);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return reportJsonResponse({
      ok: false,
      message: error.message
    });
  }
}

function setupReportSheet() {
  const sheet = getOrCreateReportSheet();

  ensureReportHeaders(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, REPORT_HEADERS.length);
  sheet.getRange(1, 1, 1, REPORT_HEADERS.length)
    .setBackground("#65ad17")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
}

function saveModuleReport(payload) {
  if (String(payload.action || "") !== "saveModuleReport") {
    throw new Error("Unsupported module report action.");
  }

  const studentId = normalizeReportStudentId(payload.studentId);
  const moduleId = String(payload.moduleId || "");

  if (!studentId || !moduleId || !payload.imageData) {
    throw new Error("Student ID, module ID, and report image are required.");
  }

  const quizAttempt = findLatestQuizAttempt(studentId, moduleId);

  if (!quizAttempt) {
    throw new Error("A matching saved quiz submission was not found.");
  }

  validateReportAgainstQuiz(payload, quizAttempt);

  const student = findReportStudent(studentId);

  if (!student) {
    throw new Error("Student ID was not found in the registration database.");
  }

  const reportSheet = getOrCreateReportSheet();
  const existingReport = findExistingReport(reportSheet, studentId, moduleId, quizAttempt.timestamp);

  if (existingReport) {
    return reportJsonResponse({
      ok: true,
      report: existingReport
    });
  }

  const moduleNumber = reportModuleNumber(moduleId);
  const fileBaseName = reportFileBaseName(studentId, moduleNumber);
  const pngFileName = fileBaseName + ".png";
  const pdfFileName = fileBaseName + ".pdf";
  const moduleFolder = getReportModuleFolder(moduleNumber);
  const pngBlob = reportImageBlob(payload.imageData, pngFileName);
  const pngFile = moduleFolder.createFile(pngBlob);
  const pdfBlob = pngBlob.getAs(MimeType.PDF).setName(pdfFileName);
  const pdfFile = moduleFolder.createFile(pdfBlob);

  makeReportFileShareable(pngFile);
  makeReportFileShareable(pdfFile);

  const pngUrl = pngFile.getUrl();
  const pdfUrl = pdfFile.getUrl();
  const pngDownloadUrl = reportDownloadUrl(pngFile.getId());
  const pdfDownloadUrl = reportDownloadUrl(pdfFile.getId());
  const result = quizAttempt.passed ? "Passed" : "Failed";
  const moduleName = quizAttempt.moduleTitle || String(payload.moduleName || moduleId);
  const questionBreakdown = sanitizeQuestionBreakdown(payload.questionBreakdown);
  const whatsappMessage = buildReportWhatsAppMessage({
    studentId: studentId,
    moduleName: moduleName,
    score: quizAttempt.score,
    totalQuestions: quizAttempt.total,
    percentage: quizAttempt.percentage,
    passed: quizAttempt.passed,
    downloadUrl: pngDownloadUrl
  });
  const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(whatsappMessage);
  const timeGenerated = new Date();
  const emailStatus = emailModuleReport({
    student: student,
    moduleName: moduleName,
    result: result,
    score: quizAttempt.score,
    totalQuestions: quizAttempt.total,
    percentage: quizAttempt.percentage,
    pngBlob: pngBlob,
    pdfBlob: pdfBlob,
    pngDownloadUrl: pngDownloadUrl
  });

  reportSheet.appendRow([
    timeGenerated,
    quizAttempt.timestamp,
    studentId,
    student["Full Name"] || "",
    moduleId,
    moduleName,
    "Module Quiz",
    quizAttempt.score,
    quizAttempt.total,
    quizAttempt.percentage + "%",
    result,
    questionBreakdownToText(questionBreakdown),
    pngUrl,
    pngDownloadUrl,
    pdfUrl,
    pdfDownloadUrl,
    whatsappUrl,
    moduleFolder.getUrl(),
    quizAttempt.cycle,
    "Generated",
    emailStatus,
    String(payload.pageUrl || "")
  ]);

  return reportJsonResponse({
    ok: true,
    report: {
      status: "Generated",
      emailStatus: emailStatus,
      timeGenerated: timeGenerated.toISOString(),
      completionDate: quizAttempt.timestamp.toISOString(),
      fileName: pngFileName,
      pdfFileName: pdfFileName,
      pngUrl: pngUrl,
      pngDownloadUrl: pngDownloadUrl,
      pdfUrl: pdfUrl,
      pdfDownloadUrl: pdfDownloadUrl,
      whatsappUrl: whatsappUrl,
      driveFolderUrl: moduleFolder.getUrl()
    }
  });
}

function validateReportAgainstQuiz(payload, quizAttempt) {
  const score = Number(payload.score);
  const totalQuestions = Number(payload.totalQuestions);
  const percentage = Number(payload.percentage);
  const passed = Boolean(payload.passed);
  const breakdown = sanitizeQuestionBreakdown(payload.questionBreakdown);
  const correctCount = breakdown.filter(function(question) {
    return question.correct;
  }).length;

  if (
    score !== quizAttempt.score ||
    totalQuestions !== quizAttempt.total ||
    percentage !== quizAttempt.percentage ||
    passed !== quizAttempt.passed
  ) {
    throw new Error("Report values do not match the saved quiz result.");
  }

  if (breakdown.length !== quizAttempt.total || correctCount !== quizAttempt.score) {
    throw new Error("Question breakdown does not match the saved quiz score.");
  }
}

function findLatestQuizAttempt(studentId, moduleId) {
  const spreadsheet = SpreadsheetApp.openById(REPORT_CONFIG.QUIZ_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(REPORT_CONFIG.QUIZ_SHEET_NAME);

  if (!sheet) {
    throw new Error("Module quiz submission sheet was not found.");
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return null;
  }

  const headers = values[0].map(function(header) {
    return String(header || "");
  });
  const column = reportColumnMap(headers);

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const row = values[rowIndex];

    if (
      normalizeReportStudentId(row[column["Student ID"]]) !== studentId ||
      String(row[column["Module ID"]] || "") !== moduleId
    ) {
      continue;
    }

    const timestamp = row[column["Timestamp"]] instanceof Date
      ? row[column["Timestamp"]]
      : new Date(row[column["Timestamp"]]);

    if (isNaN(timestamp.getTime())) {
      throw new Error("The saved quiz completion date is invalid.");
    }

    return {
      timestamp: timestamp,
      moduleTitle: String(row[column["Module Title"]] || ""),
      score: Number(row[column["Score"]] || 0),
      total: Number(row[column["Total Questions"]] || 0),
      percentage: parseFloat(String(row[column["Percentage"]] || "0").replace("%", "")) || 0,
      passed: String(row[column["Result"]] || "") === "Passed",
      cycle: Number(row[column["Cycle"]] || 1)
    };
  }

  return null;
}

function findReportStudent(studentId) {
  const spreadsheet = SpreadsheetApp.openById(REPORT_CONFIG.REGISTRATION_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(REPORT_CONFIG.REGISTRATION_SHEET_NAME);

  if (!sheet) {
    throw new Error("Registration sheet was not found.");
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return null;
  }

  const headers = values[0].map(function(header) {
    return String(header || "");
  });
  const studentIdColumn = headers.indexOf("Student ID");

  if (studentIdColumn < 0) {
    throw new Error("Student ID column is missing from the registration sheet.");
  }

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (normalizeReportStudentId(values[rowIndex][studentIdColumn]) !== studentId) {
      continue;
    }

    const student = {};

    headers.forEach(function(header, columnIndex) {
      student[header] = reportDisplayValue(values[rowIndex][columnIndex]);
    });

    return student;
  }

  return null;
}

function getOrCreateReportSheet() {
  const spreadsheet = SpreadsheetApp.openById(REPORT_CONFIG.QUIZ_SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(REPORT_CONFIG.REPORT_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(REPORT_CONFIG.REPORT_SHEET_NAME);
  }

  ensureReportHeaders(sheet);
  return sheet;
}

function ensureReportHeaders(sheet) {
  sheet.getRange(1, 1, 1, REPORT_HEADERS.length).setValues([REPORT_HEADERS]);
  sheet.setFrozenRows(1);
}

function findExistingReport(sheet, studentId, moduleId, completionDate) {
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return null;
  }

  const headers = values[0].map(function(header) {
    return String(header || "");
  });
  const column = reportColumnMap(headers);

  for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    const row = values[rowIndex];
    const savedCompletionDate = row[column["Completion Date"]] instanceof Date
      ? row[column["Completion Date"]]
      : new Date(row[column["Completion Date"]]);

    if (
      normalizeReportStudentId(row[column["Student ID"]]) !== studentId ||
      String(row[column["Module ID"]] || "") !== moduleId ||
      isNaN(savedCompletionDate.getTime()) ||
      savedCompletionDate.getTime() !== completionDate.getTime() ||
      String(row[column["Status"]] || "") !== "Generated"
    ) {
      continue;
    }

    const generatedAt = row[column["Time Generated"]] instanceof Date
      ? row[column["Time Generated"]]
      : new Date(row[column["Time Generated"]]);

    return {
      status: "Generated",
      emailStatus: String(row[column["Email Status"]] || ""),
      timeGenerated: isNaN(generatedAt.getTime()) ? "" : generatedAt.toISOString(),
      completionDate: completionDate.toISOString(),
      fileName: reportFileBaseName(studentId, reportModuleNumber(moduleId)) + ".png",
      pdfFileName: reportFileBaseName(studentId, reportModuleNumber(moduleId)) + ".pdf",
      pngUrl: String(row[column["PNG Report URL"]] || ""),
      pngDownloadUrl: String(row[column["PNG Download URL"]] || ""),
      pdfUrl: String(row[column["PDF Report URL"]] || ""),
      pdfDownloadUrl: String(row[column["PDF Download URL"]] || ""),
      whatsappUrl: String(row[column["WhatsApp Share URL"]] || ""),
      driveFolderUrl: String(row[column["Drive Folder"]] || "")
    };
  }

  return null;
}

function getReportModuleFolder(moduleNumber) {
  const rootFolder = getOrCreateDriveFolder(null, REPORT_CONFIG.DRIVE_ROOT_FOLDER);
  const reportsFolder = getOrCreateDriveFolder(rootFolder, REPORT_CONFIG.DRIVE_REPORTS_FOLDER);
  return getOrCreateDriveFolder(reportsFolder, "Module " + moduleNumber);
}

function getOrCreateDriveFolder(parent, name) {
  const folders = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function reportImageBlob(imageData, fileName) {
  const base64Data = String(imageData).replace(/^data:image\/png;base64,/i, "");
  return Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    "image/png",
    fileName
  );
}

function makeReportFileShareable(file) {
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    console.log("Report file sharing could not be changed: " + error.message);
  }
}

function emailModuleReport(details) {
  const emailAddress = String(details.student["Email Address"] || "");

  if (!emailAddress) {
    return "No student email";
  }

  try {
    MailApp.sendEmail({
      to: emailAddress,
      subject: "Module Completed Successfully",
      body:
        "Hello " + (details.student["Full Name"] || "student") + ",\n\n" +
        "Your module task completion report has been generated.\n\n" +
        "Module: " + details.moduleName + "\n" +
        "Score: " + details.score + "/" + details.totalQuestions + "\n" +
        "Percentage: " + details.percentage + "%\n" +
        "Result: " + details.result + "\n\n" +
        "Download: " + details.pngDownloadUrl + "\n\n" +
        "Keep learning and building.\n\n" +
        REPORT_CONFIG.ACADEMY_NAME,
      attachments: [
        details.pngBlob.copyBlob(),
        details.pdfBlob.copyBlob()
      ],
      name: REPORT_CONFIG.ACADEMY_NAME
    });

    return "Sent";
  } catch (error) {
    return "Failed: " + error.message;
  }
}

function buildReportWhatsAppMessage(details) {
  return [
    "🎉 Module Task Completed",
    "",
    "Student ID: " + details.studentId,
    "Module: " + details.moduleName,
    "Score: " + details.score + "/" + details.totalQuestions + " (" + details.percentage + "%)",
    "",
    details.passed
      ? "Excellent work! Keep mastering AI Tools 🚀"
      : "Keep improving. Your next correction will move you forward.",
    "",
    "Download report: " + details.downloadUrl
  ].join("\n");
}

function sanitizeQuestionBreakdown(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 20).map(function(question, index) {
    return {
      number: index + 1,
      question: String(question.question || "").slice(0, 300),
      correct: Boolean(question.correct)
    };
  });
}

function questionBreakdownToText(questions) {
  return questions.map(function(question) {
    return question.number + ". " + question.question + " - " +
      (question.correct ? "Correct" : "Incorrect");
  }).join("\n");
}

function reportModuleNumber(moduleId) {
  const match = String(moduleId || "").match(/(\d+)/);
  return match ? match[1] : "0";
}

function reportFileBaseName(studentId, moduleNumber) {
  const safeStudentId = String(studentId || "Student")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 50);

  return safeStudentId + "_Module" + moduleNumber + "_Report";
}

function reportDownloadUrl(fileId) {
  return "https://drive.google.com/uc?export=download&id=" + fileId;
}

function reportColumnMap(headers) {
  const columns = {};

  headers.forEach(function(header, index) {
    columns[header] = index;
  });

  return columns;
}

function normalizeReportStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

function reportDisplayValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value === null || value === undefined ? "" : String(value);
}

function parseReportPayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("No module report data received.");
  }

  return JSON.parse(e.postData.contents);
}

function reportJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
