import { academyData } from "./academyData";

export function normalizeStudentId(value) {
  return String(value || "").trim().toUpperCase();
}

export function readStudentSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(academyData.sessionKey) || "null");

    if (!saved?.studentId) {
      return null;
    }

    return {
      ...saved,
      studentId: normalizeStudentId(saved.studentId)
    };
  } catch (error) {
    return null;
  }
}

export function writeStudentSession(profile) {
  const session = {
    studentId: normalizeStudentId(profile.studentId),
    profile,
    signedInAt: new Date().toISOString()
  };

  localStorage.setItem(academyData.sessionKey, JSON.stringify(session));
  return session;
}

export function clearStudentSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(academyData.sessionKey);
  }
}

export function rememberRecentStudentId(studentId) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(academyData.recentStudentIdKey, normalizeStudentId(studentId));
  }
}

export function readRecentStudentId() {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeStudentId(sessionStorage.getItem(academyData.recentStudentIdKey));
}
