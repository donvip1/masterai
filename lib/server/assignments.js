function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch (error) {
    return {};
  }
}

function normalizeStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

module.exports = async function assignmentsHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { ok: false, message: "Method not allowed." });

  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) return sendJson(res, 503, { ok: false, message: "Assignment database is not connected." });

  const body = req.method === "POST" ? parseBody(req) : {};
  const studentId = normalizeStudentId(req.method === "GET" ? req.query.studentId : body.studentId);
  if (!studentId) return sendJson(res, 400, { ok: false, message: "Student ID is required." });

  try {
    let response;

    if (req.method === "GET") {
      const url = new URL(scriptUrl);
      url.searchParams.set("action", "assignments");
      url.searchParams.set("studentId", studentId);
      response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    } else {
      response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "studentAssignmentUpdate",
          studentId,
          assignmentId: String(body.assignmentId || ""),
          status: String(body.status || ""),
          submission: String(body.submission || ""),
          note: String(body.note || "")
        }),
        cache: "no-store"
      });
    }

    const result = await parseResponse(response);
    if (!response.ok || !result.ok) return sendJson(res, 502, { ok: false, message: result.message || "Assignment request failed." });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 502, { ok: false, message: "Could not reach the assignment database." });
  }
};
