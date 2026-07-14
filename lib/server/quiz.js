const quizModules = require("../../quiz-data");

const ACADEMY_NAME = "Everything for Free Academy";
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

function normalizeStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

function findModule(moduleId) {
  return quizModules.find((module) => module.id === moduleId) || null;
}

function publicModule(module) {
  if (!module) {
    return null;
  }

  return {
    id: module.id,
    title: module.title,
    questions: module.questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: question.options
    }))
  };
}

function validateAnswers(module, answers) {
  if (!Array.isArray(answers)) {
    return "Quiz answers are missing.";
  }

  const answersById = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));

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

function scoreQuiz(module, answers) {
  const answersById = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
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
    results,
    score,
    total,
    percentage,
    passed: percentage >= PASS_MARK
  };
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

async function fetchQuizStatus(scriptUrl, studentId) {
  const statusUrl = new URL(scriptUrl);
  statusUrl.searchParams.set("action", "status");
  statusUrl.searchParams.set("studentId", studentId);

  const response = await fetch(statusUrl, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });
  const result = await readJsonResponse(response);

  return {
    response,
    result
  };
}

function statusErrorCode(result) {
  if (result.code === "STUDENT_NOT_FOUND") {
    return 401;
  }

  if (result.code === "QUIZ_COOLDOWN" || result.code === "MODULE_LOCKED") {
    return 409;
  }

  return 502;
}

module.exports = async function quizHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  const scriptUrl = process.env.GOOGLE_QUIZ_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 503, {
      ok: false,
      message: `${ACADEMY_NAME} quiz access is not connected yet. Add GOOGLE_QUIZ_SCRIPT_URL in Vercel.`
    });
  }

  if (req.method === "GET") {
    const studentId = normalizeStudentId(req.query.studentId);

    if (!studentId) {
      return sendJson(res, 400, { ok: false, message: "Student ID is required." });
    }

    try {
      const { response, result } = await fetchQuizStatus(scriptUrl, studentId);

      if (!response.ok || !result.ok || !result.quizState) {
        return sendJson(res, statusErrorCode(result), {
          ok: false,
          message: result.message || "Quiz status could not be loaded. Update and redeploy the quiz Apps Script."
        });
      }

      const allowedModule = findModule(result.quizState.allowedModuleId);

      return sendJson(res, 200, {
        ok: true,
        student: result.student,
        quizState: result.quizState,
        module: result.quizState.canAttempt
          ? publicModule(allowedModule)
          : allowedModule
            ? { id: allowedModule.id, title: allowedModule.title, questions: [] }
            : null
      });
    } catch (error) {
      return sendJson(res, 502, {
        ok: false,
        message: "Could not reach the quiz database. Try again shortly."
      });
    }
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const payload = parseBody(req);

  if (payload.quizWebsite) {
    return sendJson(res, 200, { ok: true });
  }

  const studentId = normalizeStudentId(payload.studentId);
  const module = findModule(payload.moduleId);

  if (!studentId) {
    return sendJson(res, 401, { ok: false, message: "Sign in with your Student ID before taking a quiz." });
  }

  if (!module) {
    return sendJson(res, 400, { ok: false, message: "Selected quiz module is not valid." });
  }

  const validationError = validateAnswers(module, payload.answers);

  if (validationError) {
    return sendJson(res, 400, { ok: false, message: validationError });
  }

  try {
    const statusResponse = await fetchQuizStatus(scriptUrl, studentId);
    const currentStatus = statusResponse.result;

    if (!statusResponse.response.ok || !currentStatus.ok || !currentStatus.quizState) {
      return sendJson(res, statusErrorCode(currentStatus), {
        ok: false,
        message: currentStatus.message || "Student quiz access could not be verified."
      });
    }

    if (currentStatus.quizState.allowedModuleId !== module.id) {
      return sendJson(res, 409, {
        ok: false,
        message: "Complete your current module before attempting another module.",
        quizState: currentStatus.quizState
      });
    }

    if (!currentStatus.quizState.canAttempt) {
      return sendJson(res, 409, {
        ok: false,
        message: currentStatus.quizState.lockReason,
        quizState: currentStatus.quizState
      });
    }

    const scored = scoreQuiz(module, payload.answers);
    const submission = {
      action: "submitQuiz",
      studentId,
      moduleId: module.id,
      moduleTitle: module.title,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      passed: scored.passed,
      resultStatus: scored.passed ? "Passed" : "Needs Review",
      answers: scored.results,
      pageUrl: payload.pageUrl || "",
      submittedAt: new Date().toISOString()
    };
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(submission)
    });
    const result = await readJsonResponse(response);

    if (!response.ok || !result.ok) {
      return sendJson(res, statusErrorCode(result), {
        ok: false,
        message: result.message || "Google Apps Script rejected the quiz submission.",
        quizState: result.quizState
      });
    }

    return sendJson(res, 200, {
      ok: true,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      passed: scored.passed,
      resultStatus: submission.resultStatus,
      quizState: result.quizState,
      report: {
        studentId,
        moduleId: module.id,
        moduleName: module.title,
        taskType: "Module Quiz",
        completionDate: submission.submittedAt,
        percentage: scored.percentage,
        score: scored.score,
        totalQuestions: scored.total,
        result: scored.passed ? "Passed" : "Failed",
        passed: scored.passed,
        cycle: currentStatus.quizState.cycle,
        questionBreakdown: scored.results.map((answer, index) => ({
          number: index + 1,
          questionId: answer.questionId,
          question: answer.question,
          correct: answer.correct
        }))
      }
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      message: "Could not reach the module quiz database. Try again shortly."
    });
  }
};
