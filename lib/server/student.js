const ACADEMY_NAME = "Everything for Free Academy";

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

module.exports = async function studentHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const studentId = normalizeStudentId(parseBody(req).studentId);

  if (!studentId) {
    return sendJson(res, 400, { ok: false, message: "Enter your Student ID." });
  }

  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 503, {
      ok: false,
      message: `${ACADEMY_NAME} student login is not connected yet. Add GOOGLE_REGISTRATION_SCRIPT_URL in Vercel.`
    });
  }

  try {
    const lookupUrl = new URL(scriptUrl);
    lookupUrl.searchParams.set("action", "student");
    lookupUrl.searchParams.set("studentId", studentId);

    const response = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });
    const text = await response.text();
    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch (error) {
      result = {};
    }

    if (!response.ok || !result.ok || !result.student) {
      const statusCode = result.code === "STUDENT_NOT_FOUND"
        ? 404
        : result.code === "STUDENT_SUSPENDED"
          ? 403
          : 502;

      return sendJson(res, statusCode, {
        ok: false,
        message: result.message || "Student ID could not be verified. Confirm the ID or contact an admin."
      });
    }

    return sendJson(res, 200, {
      ok: true,
      student: result.student
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      message: "Could not reach the student database. Try again shortly or contact an admin."
    });
  }
};
