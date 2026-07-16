const CONFIG = {
  SPREADSHEET_ID: "1EDxb3GMWbtvhajmnHl15tsVm9wUFzGLwRzVEP394jBk",
  SHEET_NAME: "Module Quiz Submissions",
  REGISTRATION_SPREADSHEET_ID: "1ZyoIUgUphrqp0gUeL49wPOWnHtktSwNFvhgh9oxcWnw",
  REGISTRATION_SHEET_NAME: "Registrations",
  NOTIFICATION_EMAIL: "viplearn4free@gmail.com",
  ACADEMY_NAME: "Everything for Free Academy",
  PASS_MARK: 70,
  PASSED_COOLDOWN_HOURS: 48,
  FAILED_RETRY_MINUTES: 30
};

const MODULE_ORDER = [
  "module-0",
  "module-1",
  "module-2",
  "module-3",
  "module-4",
  "module-5",
  "module-6",
  "module-7",
  "module-8",
  "module-9",
  "module-10",
  "module-11",
  "module-12",
  "module-13",
  "module-14"
];

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
  "Page URL",
  "Cycle",
  "Next Attempt At"
];

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || "") : "";

  if (action === "status") {
    return handleQuizStatus(e.parameter.studentId);
  }

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

function handleQuizStatus(studentId) {
  const normalizedStudentId = normalizeStudentId(studentId);

  if (!normalizedStudentId) {
    return jsonResponse({
      ok: false,
      code: "STUDENT_ID_REQUIRED",
      message: "Student ID is required."
    });
  }

  const student = findRegisteredStudent(normalizedStudentId);

  if (!student) {
    return jsonResponse({
      ok: false,
      code: "STUDENT_NOT_FOUND",
      message: "Student ID was not found in the registration database."
    });
  }

  if (String(student["Registration Status"] || "").toLowerCase() === "suspended") {
    return jsonResponse({
      ok: false,
      code: "STUDENT_SUSPENDED",
      message: "This Student ID has been suspended. Contact the academy admin for assistance."
    });
  }

  const quizState = buildQuizState(getOrCreateSheet(), normalizedStudentId);

  return jsonResponse({
    ok: true,
    student: publicStudentProfile(student),
    quizState: quizState
  });
}

function handleQuizSubmission(payload) {
  const studentId = normalizeStudentId(payload.studentId);
  const moduleId = String(payload.moduleId || "");

  if (!studentId) {
    return jsonResponse({
      ok: false,
      code: "STUDENT_ID_REQUIRED",
      message: "Sign in with your Student ID before taking a quiz."
    });
  }

  if (MODULE_ORDER.indexOf(moduleId) < 0) {
    return jsonResponse({
      ok: false,
      code: "INVALID_MODULE",
      message: "Selected quiz module is not valid."
    });
  }

  const student = findRegisteredStudent(studentId);

  if (!student) {
    return jsonResponse({
      ok: false,
      code: "STUDENT_NOT_FOUND",
      message: "Student ID was not found in the registration database."
    });
  }

  if (String(student["Registration Status"] || "").toLowerCase() === "suspended") {
    return jsonResponse({
      ok: false,
      code: "STUDENT_SUSPENDED",
      message: "This Student ID has been suspended. Contact the academy admin for assistance."
    });
  }

  const sheet = getOrCreateSheet();
  const currentState = buildQuizState(sheet, studentId);

  if (moduleId !== currentState.allowedModuleId) {
    return jsonResponse({
      ok: false,
      code: "MODULE_LOCKED",
      message: "Complete your current module before attempting another module.",
      quizState: currentState
    });
  }

  if (!currentState.canAttempt) {
    return jsonResponse({
      ok: false,
      code: "QUIZ_COOLDOWN",
      message: currentState.lockReason,
      quizState: currentState
    });
  }

  const percentage = Number(payload.percentage || 0);
  const result = percentage >= CONFIG.PASS_MARK ? "Passed" : "Needs Review";
  const nextAttemptAt = new Date(
    Date.now() + (
      result === "Passed"
        ? CONFIG.PASSED_COOLDOWN_HOURS * 60 * 60 * 1000
        : CONFIG.FAILED_RETRY_MINUTES * 60 * 1000
    )
  );
  const submission = {
    studentId: studentId,
    fullName: student["Full Name"] || "",
    whatsappNumber: student["WhatsApp Number"] || "",
    emailAddress: student["Email Address"] || "",
    moduleId: moduleId,
    moduleTitle: payload.moduleTitle || moduleId,
    score: Number(payload.score || 0),
    total: Number(payload.total || 0),
    percentage: percentage,
    resultStatus: result,
    answers: payload.answers,
    pageUrl: payload.pageUrl || ""
  };

  sheet.appendRow([
    new Date(),
    submission.studentId,
    submission.fullName,
    submission.whatsappNumber,
    submission.emailAddress,
    submission.moduleId,
    submission.moduleTitle,
    submission.score,
    submission.total,
    submission.percentage + "%",
    submission.resultStatus,
    quizAnswersToText(submission.answers),
    submission.pageUrl,
    currentState.cycle,
    nextAttemptAt
  ]);

  sendQuizAdminEmail(submission);
  sendQuizStudentEmail(submission);

  return jsonResponse({
    ok: true,
    quizState: buildQuizState(sheet, studentId)
  });
}

function buildQuizState(sheet, studentId) {
  const history = getStudentQuizHistory(sheet, studentId);
  let cycle = history.reduce(function(highest, attempt) {
    return Math.max(highest, attempt.cycle);
  }, 1);
  let cycleHistory = history.filter(function(attempt) {
    return attempt.cycle === cycle;
  });
  let results = latestModuleResults(cycleHistory);
  let completedModules = MODULE_ORDER.filter(function(moduleId) {
    return results[moduleId] && results[moduleId].result === "Passed";
  });
  const completedCycle = completedModules.length === MODULE_ORDER.length;

  if (completedCycle) {
    cycle += 1;
    cycleHistory = [];
    results = {};
    completedModules = [];
  }

  const allowedModuleId = MODULE_ORDER.find(function(moduleId) {
    return completedModules.indexOf(moduleId) < 0;
  }) || MODULE_ORDER[0];
  const latestAttempt = history.length ? history[history.length - 1] : null;
  let canAttempt = true;
  let nextAttemptAt = "";
  let lockReason = "";

  if (latestAttempt) {
    const cooldownMilliseconds = latestAttempt.result === "Passed"
      ? CONFIG.PASSED_COOLDOWN_HOURS * 60 * 60 * 1000
      : CONFIG.FAILED_RETRY_MINUTES * 60 * 1000;
    const availableAt = new Date(latestAttempt.timestamp.getTime() + cooldownMilliseconds);

    if (Date.now() < availableAt.getTime()) {
      canAttempt = false;
      nextAttemptAt = availableAt.toISOString();
      lockReason = latestAttempt.result === "Passed"
        ? "Your next module opens 48 hours after your last passed quiz."
        : "You can submit your correction 30 minutes after the failed attempt.";
    }
  }

  return {
    cycle: cycle,
    cycleReset: completedCycle,
    allowedModuleId: allowedModuleId,
    completedModules: completedModules,
    completedCount: completedModules.length,
    totalModules: MODULE_ORDER.length,
    progressPercent: Math.round((completedModules.length / MODULE_ORDER.length) * 100),
    attemptsCount: cycleHistory.length,
    totalAttemptsCount: history.length,
    passedAttemptsCount: history.filter(function(attempt) {
      return attempt.result === "Passed";
    }).length,
    perfectScoresCount: history.filter(function(attempt) {
      return attempt.percentage >= 100;
    }).length,
    bestScore: history.reduce(function(best, attempt) {
      return Math.max(best, Number(attempt.percentage || 0));
    }, 0),
    activityDates: history.map(function(attempt) {
      return attempt.timestamp.toISOString();
    }),
    results: results,
    latestResult: latestAttempt ? publicQuizAttempt(latestAttempt) : null,
    canAttempt: canAttempt,
    nextAttemptAt: nextAttemptAt,
    lockReason: lockReason
  };
}

function getStudentQuizHistory(sheet, studentId) {
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function(header) {
    return String(header || "");
  });
  const column = {};

  headers.forEach(function(header, index) {
    column[header] = index;
  });

  return values.slice(1)
    .filter(function(row) {
      return normalizeStudentId(row[column["Student ID"]]) === studentId;
    })
    .map(function(row) {
      const timestamp = row[column["Timestamp"]] instanceof Date
        ? row[column["Timestamp"]]
        : new Date(row[column["Timestamp"]]);

      return {
        timestamp: isNaN(timestamp.getTime()) ? new Date(0) : timestamp,
        moduleId: String(row[column["Module ID"]] || ""),
        moduleTitle: String(row[column["Module Title"]] || ""),
        score: Number(row[column["Score"]] || 0),
        total: Number(row[column["Total Questions"]] || 0),
        percentage: parseFloat(String(row[column["Percentage"]] || "0").replace("%", "")) || 0,
        result: String(row[column["Result"]] || ""),
        cycle: Number(row[column["Cycle"]] || 1)
      };
    })
    .sort(function(first, second) {
      return first.timestamp.getTime() - second.timestamp.getTime();
    });
}

function latestModuleResults(history) {
  const results = {};

  history.forEach(function(attempt) {
    results[attempt.moduleId] = publicQuizAttempt(attempt);
  });

  return results;
}

function publicQuizAttempt(attempt) {
  return {
    moduleId: attempt.moduleId,
    moduleTitle: attempt.moduleTitle,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    result: attempt.result,
    submittedAt: attempt.timestamp.toISOString()
  };
}

function findRegisteredStudent(studentId) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.REGISTRATION_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.REGISTRATION_SHEET_NAME);

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
    if (normalizeStudentId(values[rowIndex][studentIdColumn]) !== studentId) {
      continue;
    }

    const student = {};

    headers.forEach(function(header, columnIndex) {
      student[header] = displayCellValue(values[rowIndex][columnIndex]);
    });

    return student;
  }

  return null;
}

function publicStudentProfile(student) {
  return {
    studentId: student["Student ID"] || "",
    fullName: student["Full Name"] || "",
    registrationStatus: student["Registration Status"] || "",
    paymentStatus: student["Payment Status"] || "",
    preferredSession: student["Preferred Session"] || "",
    occupation: student["Occupation"] || "",
    country: student["Country"] || "",
    learningInterests: student["Learning Interests"] || "",
    courseCount: student["Course Count"] || "",
    courseFee: student["Course Fee"] || "",
    adminWarning: student["Admin Warning"] || ""
  };
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
    throw new Error("No spreadsheet is connected. Paste the quiz Sheet ID into CONFIG.SPREADSHEET_ID.");
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

function normalizeStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

function displayCellValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value === null || value === undefined ? "" : String(value);
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

function sendQuizAdminEmail(submission) {
  const subject = "New Module Quiz Submission - " + CONFIG.ACADEMY_NAME;
  const body =
    "A student has submitted a module quiz.\n\n" +
    "Full Name: " + submission.fullName + "\n" +
    "Student ID: " + submission.studentId + "\n" +
    "WhatsApp: " + submission.whatsappNumber + "\n" +
    "Email: " + submission.emailAddress + "\n" +
    "Module: " + submission.moduleTitle + "\n" +
    "Score: " + submission.score + "/" + submission.total + "\n" +
    "Percentage: " + submission.percentage + "%\n" +
    "Result: " + submission.resultStatus + "\n\n" +
    "Answers:\n" + quizAnswersToText(submission.answers);

  MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

function sendQuizStudentEmail(submission) {
  if (!submission.emailAddress) {
    return;
  }

  const subject = "Quiz result received - " + CONFIG.ACADEMY_NAME;
  const body =
    "Hello " + (submission.fullName || "student") + ",\n\n" +
    "Your module quiz has been received.\n\n" +
    "Module: " + submission.moduleTitle + "\n" +
    "Score: " + submission.score + "/" + submission.total + "\n" +
    "Percentage: " + submission.percentage + "%\n" +
    "Result: " + submission.resultStatus + "\n\n" +
    (submission.resultStatus === "Passed"
      ? "Your next module opens after 48 hours."
      : "You can submit your correction after 30 minutes.") + "\n\n" +
    "Everything for Free Academy";

  MailApp.sendEmail(submission.emailAddress, subject, body);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
