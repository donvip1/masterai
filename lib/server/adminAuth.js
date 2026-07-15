const crypto = require("crypto");

const ADMIN_EMAIL = "viplearn4free@gmail.com";
const COOKIE_NAME = "eff_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

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

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(String(first || ""));
  const secondBuffer = Buffer.from(String(second || ""));

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function requestKey(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function getLoginAttempt(req) {
  const key = requestKey(req);
  const attempt = loginAttempts.get(key);

  if (!attempt || Date.now() - attempt.startedAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { key, count: 0, startedAt: Date.now() };
  }

  return { key, ...attempt };
}

function isSameOrigin(req) {
  const origin = String(req.headers.origin || "");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === String(req.headers.host || "");
  } catch (error) {
    return false;
  }
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function signValue(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({
    email: ADMIN_EMAIL,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    nonce: crypto.randomBytes(16).toString("hex")
  })).toString("base64url");

  return `${payload}.${signValue(payload)}`;
}

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .reduce((cookies, pair) => {
      const separator = pair.indexOf("=");

      if (separator > 0) {
        cookies[pair.slice(0, separator).trim()] = decodeURIComponent(pair.slice(separator + 1));
      }

      return cookies;
    }, {});
}

function verifyAdminSession(req) {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const token = parseCookies(req)[COOKIE_NAME] || "";
  const separator = token.lastIndexOf(".");

  if (separator < 1) {
    return null;
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, signValue(payload))) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (session.email !== ADMIN_EMAIL || Number(session.expiresAt) <= Date.now()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function requireAdmin(req, res) {
  const session = verifyAdminSession(req);

  if (!session) {
    sendJson(res, 401, { ok: false, message: "Admin sign-in required." });
    return null;
  }

  return session;
}

async function adminAuthHandler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET") {
    const session = verifyAdminSession(req);
    return sendJson(res, 200, {
      ok: true,
      authenticated: Boolean(session),
      email: session ? ADMIN_EMAIL : ""
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  if (!isSameOrigin(req)) {
    return sendJson(res, 403, { ok: false, message: "Cross-site admin requests are blocked." });
  }

  const body = parseBody(req);

  if (body.action === "logout") {
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return sendJson(res, 200, { ok: true, authenticated: false });
  }

  const password = process.env.ADMIN_PASSWORD || "";
  const sessionSecret = getSessionSecret();

  if (!password || !sessionSecret) {
    return sendJson(res, 503, {
      ok: false,
      message: "Admin login is not configured. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET in Vercel."
    });
  }

  const attempt = getLoginAttempt(req);

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return sendJson(res, 429, {
      ok: false,
      message: "Too many admin login attempts. Wait 15 minutes and try again."
    });
  }

  const emailMatches = safeEqual(String(body.email || "").trim().toLowerCase(), ADMIN_EMAIL);
  const passwordMatches = safeEqual(body.password, password);

  if (!emailMatches || !passwordMatches) {
    loginAttempts.set(attempt.key, {
      count: attempt.count + 1,
      startedAt: attempt.startedAt
    });
    return sendJson(res, 401, { ok: false, message: "Invalid admin credentials." });
  }

  loginAttempts.delete(attempt.key);
  res.setHeader("Set-Cookie", sessionCookie(createSessionToken(), SESSION_DURATION_SECONDS));
  return sendJson(res, 200, { ok: true, authenticated: true, email: ADMIN_EMAIL });
}

module.exports = {
  ADMIN_EMAIL,
  adminAuthHandler,
  parseBody,
  isSameOrigin,
  requireAdmin,
  sendJson
};
