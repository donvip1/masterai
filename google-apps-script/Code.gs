const CONFIG = {
  SHEET_NAME: "Registrations",
  QUIZ_SHEET_NAME: "Quiz Submissions",
  NOTIFICATION_EMAIL: "viplearn4free@gmail.com",
  ACADEMY_NAME: "EFF Master AI Tools Academy",
  PAYMENT_SCREENSHOT_FOLDER: "EFF Master AI Tools Academy Payment Screenshots",
  WHATSAPP_GROUP_LINK: "https://chat.whatsapp.com/EiqRwnlAbTqFksCi6jqvS7?s=cl&p=a&ilr=0",
  BANK_NAME: "Opay",
  ACCOUNT_NUMBER: "8166563757",
  ACCOUNT_HOLDER: "Phiip Awazie",
  BASE_FEE: 10000,
  FOUR_COURSE_FEE: 15000,
  EXTRA_COURSE_FEE: 3000,
  PASS_MARK: 70
};

const HEADERS = [
  "Timestamp",
  "Student ID",
  "Registration Status",
  "Course Count",
  "Course Fee",
  "Pricing Breakdown",
  "Payment Status",
  "Payment Screenshot URL",
  "Full Name",
  "Gender",
  "Phone Number",
  "WhatsApp Number",
  "Email Address",
  "State",
  "Country",
  "Occupation",
  "Used AI Before",
  "Referral Source",
  "Learning Interests",
  "Learning Device",
  "Preferred Session",
  "Attendance Commitment",
  "Expectations",
  "Agreements",
  "Page URL"
];

const QUIZ_HEADERS = [
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
    message: CONFIG.ACADEMY_NAME + " registration and quiz endpoint is live."
  });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      if (payload.submissionType === "quiz") {
        return handleQuizSubmission(payload);
      }

      return handleRegistrationSubmission(payload);
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
  const quizSheet = getOrCreateQuizSheet();

  ensureHeaders(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#16256b")
    .setFontColor("#ffffff")
    .setFontWeight("bold");

  ensureQuizHeaders(quizSheet);
  quizSheet.setFrozenRows(1);
  quizSheet.autoResizeColumns(1, QUIZ_HEADERS.length);
  quizSheet.getRange(1, 1, 1, QUIZ_HEADERS.length)
    .setBackground("#0f9488")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
}

function handleRegistrationSubmission(payload) {
  const sheet = getOrCreateSheet();
  const studentId = payload.studentId || nextStudentId(sheet);
  const pricing = calculateCoursePricing(payload.interests);
  const paymentStatus = paymentStatusFromReadiness(payload.paymentReadiness);
  const screenshotUrl = savePaymentScreenshot(payload.paymentScreenshot, studentId);
  const row = [
    new Date(),
    studentId,
    payload.registrationStatus || "Pending Review",
    pricing.courseCount,
    pricing.courseFee,
    pricing.pricingBreakdown,
    paymentStatus,
    screenshotUrl,
    payload.fullName || "",
    payload.gender || "",
    payload.phoneNumber || "",
    payload.whatsappNumber || "",
    payload.emailAddress || "",
    payload.state || "",
    payload.country || "",
    payload.occupation || "",
    payload.usedAiBefore || "",
    payload.referralSource || "",
    arrayToText(payload.interests),
    arrayToText(payload.learningDevices || payload.learningDevice),
    payload.preferredSession || "",
    payload.attendanceCommitment || "",
    payload.expectations || "",
    arrayToText(payload.agreements),
    payload.pageUrl || ""
  ];

  sheet.appendRow(row);
  sendAdminEmail(payload, studentId, paymentStatus, screenshotUrl, pricing);
  sendStudentEmail(payload, studentId, pricing, screenshotUrl);

  return jsonResponse({
    ok: true,
    studentId: studentId
  });
}

function handleQuizSubmission(payload) {
  const sheet = getOrCreateQuizSheet();
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
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }

  ensureHeaders(sheet);

  return sheet;
}

function getOrCreateQuizSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.QUIZ_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.QUIZ_SHEET_NAME);
  }

  ensureQuizHeaders(sheet);

  return sheet;
}

function ensureHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}

function ensureQuizHeaders(sheet) {
  sheet.getRange(1, 1, 1, QUIZ_HEADERS.length).setValues([QUIZ_HEADERS]);
  sheet.setFrozenRows(1);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("No registration data received.");
  }

  return JSON.parse(e.postData.contents);
}

function nextStudentId(sheet) {
  const year = new Date().getFullYear();
  const count = Math.max(sheet.getLastRow() - 1, 0) + 1;
  return "EFF-AI-" + year + "-" + String(count).padStart(3, "0");
}

function paymentStatusFromReadiness(readiness) {
  if (readiness === "I have paid and uploaded proof") {
    return "Paid - Proof Uploaded";
  }

  if (readiness === "Yes") {
    return "Ready to Pay";
  }

  if (readiness === "I need the one-week grace period") {
    return "Grace Period";
  }

  return "Discuss Payment";
}

function calculateCoursePricing(interests) {
  const count = Array.isArray(interests) ? interests.length : 0;

  if (count <= 0) {
    return {
      courseCount: 0,
      courseFee: 0,
      pricingBreakdown: "No courses selected."
    };
  }

  if (count <= 3) {
    return {
      courseCount: count,
      courseFee: CONFIG.BASE_FEE,
      pricingBreakdown: count + " course" + (count === 1 ? "" : "s") + " selected. First 1-3 courses cost ₦10,000."
    };
  }

  if (count === 4) {
    return {
      courseCount: count,
      courseFee: CONFIG.FOUR_COURSE_FEE,
      pricingBreakdown: "4 courses selected. Four-course package costs ₦15,000."
    };
  }

  const extraCourses = count - 4;
  return {
    courseCount: count,
    courseFee: CONFIG.FOUR_COURSE_FEE + extraCourses * CONFIG.EXTRA_COURSE_FEE,
    pricingBreakdown: count + " courses selected. ₦15,000 for 4 courses + " + extraCourses + " extra course" + (extraCourses === 1 ? "" : "s") + " at ₦3,000 each."
  };
}

function savePaymentScreenshot(filePayload, studentId) {
  if (!filePayload || !filePayload.data) {
    return "";
  }

  const folder = getOrCreateFolder(CONFIG.PAYMENT_SCREENSHOT_FOLDER);
  const mimeType = filePayload.mimeType || "image/jpeg";
  const base64Data = String(filePayload.data).replace(/^data:[^,]+,/, "");
  const fileName = sanitizeFileName(studentId + "-" + (filePayload.fileName || "payment-proof.jpg"));
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const file = folder.createFile(blob);

  return file.getUrl();
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

function sanitizeFileName(name) {
  return String(name).replace(/[\\/:*?"<>|#%{}~&]/g, "-").slice(0, 140);
}

function arrayToText(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";
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

function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

function sendAdminEmail(payload, studentId, paymentStatus, screenshotUrl, pricing) {
  const subject = "New Student Registration - " + CONFIG.ACADEMY_NAME;
  const body =
    "A new student has registered.\n\n" +
    "Student ID: " + studentId + "\n" +
    "Full Name: " + (payload.fullName || "") + "\n" +
    "Phone: " + (payload.phoneNumber || "") + "\n" +
    "WhatsApp: " + (payload.whatsappNumber || "") + "\n" +
    "Email: " + (payload.emailAddress || "") + "\n" +
    "Occupation: " + (payload.occupation || "") + "\n" +
    "Device: " + arrayToText(payload.learningDevices || payload.learningDevice) + "\n" +
    "Preferred Session: " + (payload.preferredSession || "") + "\n" +
    "Selected Courses: " + arrayToText(payload.interests) + "\n" +
    "Course Count: " + pricing.courseCount + "\n" +
    "Course Fee: " + formatNaira(pricing.courseFee) + "\n" +
    "Pricing: " + pricing.pricingBreakdown + "\n" +
    "Payment Status: " + paymentStatus + "\n" +
    "Payment Screenshot: " + (screenshotUrl || "Not uploaded") + "\n" +
    "Goals:\n" + (payload.expectations || "");

  MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

function sendStudentEmail(payload, studentId, pricing, screenshotUrl) {
  if (!payload.emailAddress) {
    return;
  }

  const paidGroupMessage = payload.paymentReadiness === "I have paid and uploaded proof" && screenshotUrl
    ? "Paid students WhatsApp Group: " + CONFIG.WHATSAPP_GROUP_LINK + "\n"
    : "";
  const subject = "Registration received - " + CONFIG.ACADEMY_NAME;
  const body =
    "Congratulations, " + (payload.fullName || "student") + "!\n\n" +
    "Your registration has been received.\n\n" +
    "Student ID: " + studentId + "\n" +
    "Course Duration: 30 Days\n" +
    "Selected Courses: " + arrayToText(payload.interests) + "\n" +
    "Training Fee: " + formatNaira(pricing.courseFee) + "\n" +
    "Pricing: " + pricing.pricingBreakdown + "\n" +
    "Payment Account: " + CONFIG.BANK_NAME + " - " + CONFIG.ACCOUNT_NUMBER + " - " + CONFIG.ACCOUNT_HOLDER + "\n" +
    "Class Mode: Live Google Meet + WhatsApp Community\n\n" +
    paidGroupMessage +
    "We will review your application and contact you via WhatsApp or email with payment and onboarding instructions.\n\n" +
    "Welcome to EFF Master AI Tools Academy.";

  MailApp.sendEmail(payload.emailAddress, subject, body);
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
