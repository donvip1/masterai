const CONFIG = {
  SPREADSHEET_ID: "",
  SHEET_NAME: "Module Quiz Submissions",
  NOTIFICATION_EMAIL: "viplearn4free@gmail.com",
  ACADEMY_NAME: "EFF Master AI Tools Academy",
  PASS_MARK: 70
};

const HEADERS = [
  "Timestamp",
  "Student ID",
  "Full Name",
  "WhatsApp Number",
  "Email Address",
  "Module ID",
  "Module Title",
  "Score",
  "Total Questions",
  "Percentage",
  "Result",
  "Answers",
  "Page URL"
];

function doGet() {
  return jsonResponse({
    ok: true,
    message: CONFIG.ACADEMY_NAME + " module quiz endpoint is live."
  });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      return handleQuizSubmission(payload);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error.message
    });
  }
}

function setupSheet() {
  const sheet = getOrCreateSheet();

  ensureHeaders(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#0f9488")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
}

function handleQuizSubmission(payload) {
  const sheet = getOrCreateSheet();
  const percentage = Number(payload.percentage || 0);
  const result = payload.resultStatus || (percentage >= CONFIG.PASS_MARK ? "Passed" : "Needs Review");
  const row = [
    new Date(),
    payload.studentId || "",
    payload.fullName || "",
    payload.whatsappNumber || "",
    payload.emailAddress || "",
    payload.moduleId || "",
    payload.moduleTitle || "",
    payload.score || 0,
    payload.total || 0,
    percentage + "%",
    result,
    quizAnswersToText(payload.answers),
    payload.pageUrl || ""
  ];

  sheet.appendRow(row);
  sendQuizAdminEmail(payload, result);
  sendQuizStudentEmail(payload, result);

  return jsonResponse({
    ok: true
  });
}

function getOrCreateSheet() {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  ensureHeaders(sheet);

  return sheet;
}

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error("No spreadsheet is connected. Open your module quiz Google Sheet, copy its ID from the URL, and paste it into CONFIG.SPREADSHEET_ID in QuizCode.gs.");
  }

  return spreadsheet;
}

function ensureHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("No quiz data received.");
  }

  return JSON.parse(e.postData.contents);
}

function quizAnswersToText(answers) {
  if (!Array.isArray(answers)) {
    return "";
  }

  return answers.map(function(answer, index) {
    return (index + 1) + ". " + (answer.question || "") + "\n" +
      "Selected: " + (answer.selectedAnswer || "") + "\n" +
      "Correct: " + (answer.correctAnswer || "") + "\n" +
      "Result: " + (answer.correct ? "Correct" : "Wrong");
  }).join("\n\n");
}

function sendQuizAdminEmail(payload, result) {
  const subject = "New Module Quiz Submission - " + CONFIG.ACADEMY_NAME;
  const body =
    "A student has submitted a module quiz.\n\n" +
    "Full Name: " + (payload.fullName || "") + "\n" +
    "Student ID: " + (payload.studentId || "Not provided") + "\n" +
    "WhatsApp: " + (payload.whatsappNumber || "") + "\n" +
    "Email: " + (payload.emailAddress || "") + "\n" +
    "Module: " + (payload.moduleTitle || payload.moduleId || "") + "\n" +
    "Score: " + (payload.score || 0) + "/" + (payload.total || 0) + "\n" +
    "Percentage: " + (payload.percentage || 0) + "%\n" +
    "Result: " + result + "\n\n" +
    "Answers:\n" + quizAnswersToText(payload.answers);

  MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

function sendQuizStudentEmail(payload, result) {
  if (!payload.emailAddress) {
    return;
  }

  const subject = "Quiz result received - " + CONFIG.ACADEMY_NAME;
  const body =
    "Hello " + (payload.fullName || "student") + ",\n\n" +
    "Your module quiz has been received.\n\n" +
    "Module: " + (payload.moduleTitle || payload.moduleId || "") + "\n" +
    "Score: " + (payload.score || 0) + "/" + (payload.total || 0) + "\n" +
    "Percentage: " + (payload.percentage || 0) + "%\n" +
    "Result: " + result + "\n\n" +
    "Keep practicing and follow your instructor's module review guidance.\n\n" +
    "EFF Master AI Tools Academy";

  MailApp.sendEmail(payload.emailAddress, subject, body);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
