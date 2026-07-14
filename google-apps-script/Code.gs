const CONFIG = {
  SPREADSHEET_ID: "1ZyoIUgUphrqp0gUeL49wPOWnHtktSwNFvhgh9oxcWnw",
  SHEET_NAME: "Registrations",
  NOTIFICATION_EMAIL: "viplearn4free@gmail.com",
  ACADEMY_NAME: "EFF Master AI Tools Academy",
  PAYMENT_SCREENSHOT_FOLDER: "EFF Master AI Tools Academy Payment Screenshots",
  WHATSAPP_GROUP_LINK: "https://chat.whatsapp.com/EiqRwnlAbTqFksCi6jqvS7?s=cl&p=a&ilr=0",
  BANK_NAME: "Opay",
  ACCOUNT_NUMBER: "8166563757",
  ACCOUNT_HOLDER: "Phiip Awazie",
  BASE_FEE: 10000,
  FOUR_COURSE_FEE: 15000,
  EXTRA_COURSE_FEE: 3000
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

function doGet() {
  return jsonResponse({
    ok: true,
    message: CONFIG.ACADEMY_NAME + " registration endpoint is live."
  });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
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

  ensureHeaders(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground("#16256b")
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
    throw new Error("No spreadsheet is connected. Open your registration Google Sheet, copy its ID from the URL, and paste it into CONFIG.SPREADSHEET_ID in Code.gs.");
  }

  return spreadsheet;
}

function ensureHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
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

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
