const ACADEMY_NAME = "Everything for Free Academy";
const MAX_IMAGE_DATA_LENGTH = 6_500_000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch (error) {
    return {};
  }
}

function normalizeStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

function validatePayload(payload) {
  const requiredFields = [
    "studentId",
    "moduleId",
    "moduleName",
    "completionDate",
    "score",
    "totalQuestions",
    "percentage",
    "result",
    "imageData"
  ];

  for (const field of requiredFields) {
    if (payload[field] === "" || payload[field] === null || payload[field] === undefined) {
      return `Missing report field: ${field}`;
    }
  }

  if (!/^data:image\/png;base64,/i.test(payload.imageData)) {
    return "The generated report must be a PNG image.";
  }

  if (payload.imageData.length > MAX_IMAGE_DATA_LENGTH) {
    return "The generated report image is too large to store.";
  }

  if (!Array.isArray(payload.questionBreakdown) || payload.questionBreakdown.length === 0) {
    return "Question breakdown is required for the module report.";
  }

  const score = Number(payload.score);
  const totalQuestions = Number(payload.totalQuestions);
  const percentage = Number(payload.percentage);

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(totalQuestions) ||
    !Number.isFinite(percentage) ||
    score < 0 ||
    totalQuestions <= 0 ||
    score > totalQuestions ||
    percentage < 0 ||
    percentage > 100
  ) {
    return "The report score is invalid.";
  }

  return "";
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

module.exports = async function moduleReportHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const scriptUrl = process.env.GOOGLE_REPORT_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 503, {
      ok: false,
      message: `${ACADEMY_NAME} report storage is not connected yet. Add GOOGLE_REPORT_SCRIPT_URL in Vercel.`
    });
  }

  const payload = parseBody(req);

  if (payload.reportWebsite) {
    return sendJson(res, 200, { ok: true });
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return sendJson(res, 400, { ok: false, message: validationError });
  }

  const reportPayload = {
    action: "saveModuleReport",
    studentId: normalizeStudentId(payload.studentId),
    moduleId: String(payload.moduleId),
    moduleName: String(payload.moduleName),
    taskType: String(payload.taskType || "Module Quiz"),
    completionDate: String(payload.completionDate),
    score: Number(payload.score),
    totalQuestions: Number(payload.totalQuestions),
    percentage: Number(payload.percentage),
    result: String(payload.result),
    passed: Boolean(payload.passed),
    cycle: Number(payload.cycle || 1),
    motivation: String(payload.motivation || ""),
    questionBreakdown: payload.questionBreakdown.map((question, index) => ({
      number: index + 1,
      questionId: String(question.questionId || ""),
      question: String(question.question || ""),
      correct: Boolean(question.correct)
    })),
    imageData: payload.imageData,
    pageUrl: String(payload.pageUrl || ""),
    requestedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reportPayload)
    });
    const result = await readJsonResponse(response);

    if (!response.ok || !result.ok || !result.report) {
      return sendJson(res, 502, {
        ok: false,
        message: result.message || "Google Apps Script could not store the module report."
      });
    }

    return sendJson(res, 200, {
      ok: true,
      report: result.report
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      message: "Could not reach the module report service. The PNG is still available for download on this device."
    });
  }
};
