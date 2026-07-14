const quizModules = require("../../quiz-data");

const ACADEMY_NAME = "Everything for Free Academy";
const REQUIRED_FIELDS = ["fullName", "whatsappNumber", "emailAddress", "moduleId"];
const PASS_MARK = 70;

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

function findModule(moduleId) {
  return quizModules.find((module) => module.id === moduleId) || null;
}

function validatePayload(payload) {
  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]) {
      return `Missing required field: ${field}`;
    }
  }

  const module = findModule(payload.moduleId);

  if (!module) {
    return "Selected quiz module is not valid.";
  }

  if (!Array.isArray(module.questions) || module.questions.length === 0 || module.questions.length > 10) {
    return "Selected quiz module is not configured correctly.";
  }

  if (!Array.isArray(payload.answers)) {
    return "Quiz answers are missing.";
  }

  const answersById = new Map(payload.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));

  for (const question of module.questions) {
    const selectedAnswer = answersById.get(question.id);

    if (!selectedAnswer) {
      return "Answer every objective question before submitting.";
    }

    if (!question.options.includes(selectedAnswer)) {
      return "One or more answers are invalid.";
    }
  }

  return "";
}

function scoreQuiz(payload) {
  const module = findModule(payload.moduleId);
  const answersById = new Map(payload.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const results = module.questions.map((question) => {
    const selectedAnswer = answersById.get(question.id);
    const correct = selectedAnswer === question.answer;

    return {
      questionId: question.id,
      question: question.question,
      selectedAnswer,
      correctAnswer: question.answer,
      correct
    };
  });
  const score = results.filter((answer) => answer.correct).length;
  const total = module.questions.length;
  const percentage = Math.round((score / total) * 100);

  return {
    module,
    results,
    score,
    total,
    percentage,
    passed: percentage >= PASS_MARK
  };
}

module.exports = async function quizHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const scriptUrl = process.env.GOOGLE_QUIZ_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 503, {
      ok: false,
      message: `${ACADEMY_NAME} quiz endpoint is not connected yet. Add GOOGLE_QUIZ_SCRIPT_URL in Vercel after deploying the module quiz Google Apps Script.`
    });
  }

  const payload = parseBody(req);

  if (payload.quizWebsite) {
    return sendJson(res, 200, { ok: true });
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return sendJson(res, 400, { ok: false, message: validationError });
  }

  const scored = scoreQuiz(payload);
  const quizSubmission = {
    submissionType: "quiz",
    fullName: payload.fullName.trim(),
    whatsappNumber: payload.whatsappNumber.trim(),
    emailAddress: payload.emailAddress.trim(),
    studentId: payload.studentId?.trim() || "",
    moduleId: scored.module.id,
    moduleTitle: scored.module.title,
    score: scored.score,
    total: scored.total,
    percentage: scored.percentage,
    passed: scored.passed,
    resultStatus: scored.passed ? "Passed" : "Needs Review",
    answers: scored.results,
    pageUrl: payload.pageUrl || "",
    submittedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quizSubmission)
    });

    const text = await response.text();
    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch (error) {
      result = { raw: text };
    }

    if (!response.ok || result.ok === false) {
      return sendJson(res, 502, {
        ok: false,
        message: result.message || "Google Apps Script rejected the quiz submission."
      });
    }

    return sendJson(res, 200, {
      ok: true,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      passed: scored.passed,
      resultStatus: quizSubmission.resultStatus
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      message: "Could not reach the module quiz Google Apps Script. Check GOOGLE_QUIZ_SCRIPT_URL and deployment access."
    });
  }
};
