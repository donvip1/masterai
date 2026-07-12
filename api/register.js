const REQUIRED_FIELDS = [
  "fullName",
  "gender",
  "phoneNumber",
  "whatsappNumber",
  "emailAddress",
  "state",
  "country",
  "occupation",
  "usedAiBefore",
  "referralSource",
  "preferredSession",
  "attendanceCommitment",
  "paymentReadiness",
  "expectations"
];

const PAID_PROOF_VALUE = "I have paid and uploaded proof";
const ONBOARDING_GROUP_LINK = "https://chat.whatsapp.com/EiqRwnlAbTqFksCi6jqvS7?s=cl&p=a&ilr=0";
const ALLOWED_SCREENSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SCREENSHOT_BASE64_LENGTH = 4_500_000;

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

function generateStudentId() {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);
  return `EFF-AI-${year}-${suffix}`;
}

function calculateCoursePricing(interests) {
  const count = Array.isArray(interests) ? interests.length : 0;

  if (count <= 0) {
    return {
      courseFee: 0,
      courseCount: 0,
      pricingBreakdown: "No courses selected."
    };
  }

  if (count <= 3) {
    return {
      courseFee: 10000,
      courseCount: count,
      pricingBreakdown: `${count} course${count === 1 ? "" : "s"} selected. First 1-3 courses cost ₦10,000.`
    };
  }

  if (count === 4) {
    return {
      courseFee: 15000,
      courseCount: count,
      pricingBreakdown: "4 courses selected. Four-course package costs ₦15,000."
    };
  }

  const extraCourses = count - 4;
  return {
    courseFee: 15000 + extraCourses * 3000,
    courseCount: count,
    pricingBreakdown: `${count} courses selected. ₦15,000 for 4 courses + ${extraCourses} extra course${extraCourses === 1 ? "" : "s"} at ₦3,000 each.`
  };
}

function validatePayload(payload) {
  for (const field of REQUIRED_FIELDS) {
    if (!payload[field]) {
      return `Missing required field: ${field}`;
    }
  }

  if (!Array.isArray(payload.interests) || payload.interests.length === 0) {
    return "Select at least one learning interest.";
  }

  if (!Array.isArray(payload.learningDevices) || payload.learningDevices.length === 0) {
    return "Select at least one learning device.";
  }

  if (!Array.isArray(payload.agreements) || payload.agreements.length < 4) {
    return "All agreement items must be accepted.";
  }

  const pricing = calculateCoursePricing(payload.interests);
  if (pricing.courseFee < 10000) {
    return "Course fee could not be calculated.";
  }

  const screenshot = payload.paymentScreenshot;

  if (payload.paymentReadiness === PAID_PROOF_VALUE && (!screenshot || !screenshot.data)) {
    return "Payment screenshot is required when proof of payment is selected.";
  }

  if (screenshot && screenshot.data) {
    if (!ALLOWED_SCREENSHOT_TYPES.has(screenshot.mimeType)) {
      return "Payment screenshot must be PNG, JPG, or WebP.";
    }

    if (screenshot.data.length > MAX_SCREENSHOT_BASE64_LENGTH) {
      return "Payment screenshot is too large. Upload a smaller image.";
    }
  }

  return "";
}

module.exports = async function registerHandler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "Method not allowed." });
  }

  const scriptUrl = process.env.GOOGLE_REGISTRATION_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return sendJson(res, 503, {
      ok: false,
      message: "Registration endpoint is not connected yet. Add GOOGLE_REGISTRATION_SCRIPT_URL in Vercel after deploying the registration Google Apps Script."
    });
  }

  const payload = parseBody(req);

  if (payload.website) {
    return sendJson(res, 200, { ok: true });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return sendJson(res, 400, { ok: false, message: validationError });
  }

  const pricing = calculateCoursePricing(payload.interests);
  const studentId = payload.studentId || generateStudentId();
  const registration = {
    ...payload,
    ...pricing,
    learningDevice: payload.learningDevices.join(", "),
    studentId,
    submittedAt: new Date().toISOString(),
    registrationStatus: "Pending Review"
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(registration)
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
        message: result.message || "Google Apps Script rejected the registration."
      });
    }

    return sendJson(res, 200, {
      ok: true,
      studentId: result.studentId || studentId,
      courseFee: pricing.courseFee,
      onboardingLink: payload.paymentReadiness === PAID_PROOF_VALUE ? ONBOARDING_GROUP_LINK : ""
    });
  } catch (error) {
    return sendJson(res, 502, {
      ok: false,
      message: "Could not reach the registration Google Apps Script. Check GOOGLE_REGISTRATION_SCRIPT_URL and deployment access."
    });
  }
};
