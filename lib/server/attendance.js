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

module.exports = async function attendanceHandler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) return sendJson(res, 503, { ok: false, message: "Attendance database is not connected." });
  const body = parseBody(req);
  const studentId = String(body.studentId || "").trim().toUpperCase();
  if (!studentId) return sendJson(res, 400, { ok: false, message: "Student ID is required." });

  try {
    const probe = await probeAssignmentBackend(scriptUrl, studentId);
    if (!probe.supported) {
      return sendJson(res, 503, { ok: false, message: "Attendance needs the latest academy database update before check-in can be recorded." });
    }
    if (!probe.response.ok || !probe.result.ok) {
      return sendJson(res, 502, { ok: false, message: probe.result.message || "Attendance check-in failed." });
    }

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        action: "attendanceCheckIn",
        studentId,
        sessionId: String(body.sessionId || ""),
        sessionLabel: String(body.sessionLabel || "")
      }),
      cache: "no-store"
    });
    const result = await parseScriptResponse(response);
    if (!response.ok || !result.ok) return sendJson(res, 502, { ok: false, message: result.message || "Attendance check-in failed." });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 502, { ok: false, message: "Could not reach the attendance database." });
  }
};
