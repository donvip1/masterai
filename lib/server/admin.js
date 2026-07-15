const { isSameOrigin, parseBody, requireAdmin, sendJson } = require("./adminAuth");

const ALLOWED_ACTIONS = new Set([
  "adminSaveAnnouncement",
  "adminDeleteAnnouncement",
  "adminUpdateStudent"
]);

async function callAdminBackend(action, data = {}) {
  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;
  const adminKey = process.env.ADMIN_API_KEY || "";

  if (!scriptUrl || !adminKey) {
    const error = new Error("Admin database access is not configured. Add GOOGLE_REGISTRATION_SCRIPT_URL and ADMIN_API_KEY in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      action,
      adminKey,
      ...data
    }),
    cache: "no-store"
  });
  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch (error) {
    result = {};
  }

  if (!response.ok || !result.ok) {
    const error = new Error(result.message || "The academy database rejected the admin request.");
    error.statusCode = response.ok ? 502 : response.status;
    throw error;
  }

  return result;
}

module.exports = async function adminHandler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    if (req.method === "GET") {
      const result = await callAdminBackend("adminOverview");
      return sendJson(res, 200, result);
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, message: "Method not allowed." });
    }

    if (!isSameOrigin(req)) {
      return sendJson(res, 403, { ok: false, message: "Cross-site admin requests are blocked." });
    }

    const body = parseBody(req);

    if (!ALLOWED_ACTIONS.has(body.action)) {
      return sendJson(res, 400, { ok: false, message: "Unsupported admin action." });
    }

    const result = await callAdminBackend(body.action, { payload: body.payload || {} });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, error.statusCode || 502, {
      ok: false,
      message: error.message || "Admin database request failed."
    });
  }
};
