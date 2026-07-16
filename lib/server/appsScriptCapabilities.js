const assignmentResponseCodes = new Set([
  "STUDENT_ID_REQUIRED",
  "STUDENT_NOT_FOUND",
  "STUDENT_SUSPENDED"
]);

async function parseScriptResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

function supportsAssignments(result) {
  return Array.isArray(result.assignments) || assignmentResponseCodes.has(String(result.code || ""));
}

async function probeAssignmentBackend(scriptUrl, studentId) {
  const url = new URL(scriptUrl);
  url.searchParams.set("action", "assignments");
  url.searchParams.set("studentId", studentId);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  const result = await parseScriptResponse(response);

  return {
    response,
    result,
    supported: supportsAssignments(result)
  };
}

module.exports = {
  parseScriptResponse,
  probeAssignmentBackend
};
