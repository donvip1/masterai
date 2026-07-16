const { parseScriptResponse, probeAssignmentBackend } = require("./appsScriptCapabilities");

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
    let result;

    if (req.method === "GET") {
      const probe = await probeAssignmentBackend(scriptUrl, studentId);
      if (!probe.supported) {
        return sendJson(res, 503, { ok: false, message: "The assignment database needs its latest backend update." });
      }
      response = probe.response;
      result = probe.result;
    } else {
      const probe = await probeAssignmentBackend(scriptUrl, studentId);
      if (!probe.supported) {
        return sendJson(res, 503, { ok: false, message: "The assignment database needs its latest backend update." });
      }
      if (!probe.response.ok || !probe.result.ok) {
        return sendJson(res, 502, { ok: false, message: probe.result.message || "Assignment request failed." });
      }
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
      result = await parseScriptResponse(response);
    }

    if (!response.ok || !result.ok) return sendJson(res, 502, { ok: false, message: result.message || "Assignment request failed." });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 502, { ok: false, message: "Could not reach the assignment database." });
  }
};
