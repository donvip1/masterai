const FALLBACK_ANNOUNCEMENTS = [
  {
    id: "announcement-board",
    label: "Announcement Board",
    title: "Latest academy notices will be posted here.",
    detail: "Check back for class reminders, deadlines, payment updates, and special announcements."
  },
  {
    id: "batch-two",
    label: "Registration",
    title: "Batch 2 registration is open.",
    detail: "New students should complete the registration form and watch for WhatsApp or email onboarding."
  }
];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = async function announcementsHandler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 200, { ok: true, announcements: FALLBACK_ANNOUNCEMENTS, fallback: true });
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set("action", "announcements");
    const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    const result = await response.json();

    if (!response.ok || !result.ok || !Array.isArray(result.announcements)) {
      throw new Error("Announcements unavailable");
    }

    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 200, { ok: true, announcements: FALLBACK_ANNOUNCEMENTS, fallback: true });
  }
};
