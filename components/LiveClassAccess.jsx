"use client";

import { useEffect, useState } from "react";
import { academyData } from "../lib/academyData";
import { getLiveClassStatus } from "../lib/liveClassSchedule";

const refreshInterval = 1000;

function formatCountdown(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) {
    return "";
  }

  if (totalSeconds <= 0) {
    return "Live now";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export default function LiveClassAccess({ preferredSession = "", studentId = "" }) {
  const [currentTime, setCurrentTime] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({ type: "", message: "" });
  const liveClasses = academyData.academy.liveClasses;

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = window.setInterval(() => setCurrentTime(new Date()), refreshInterval);
    return () => window.clearInterval(timer);
  }, []);

  if (!currentTime) {
    return null;
  }

  const status = getLiveClassStatus(
    currentTime,
    academyData.academy.classDays,
    liveClasses
  );
  const meetingOpen = Boolean(status.activeSession);
  const countdown = formatCountdown(status.secondsUntilStart);

  async function checkInAttendance() {
    if (!status.activeSession || !studentId) return;
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: liveClasses.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(currentTime);

    setAttendanceStatus({ type: "", message: "Checking in..." });
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          studentId,
          sessionId: `${status.activeSession.id}-${dateKey}`,
          sessionLabel: status.activeLabel
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "Attendance check-in failed.");
      setAttendanceStatus({ type: "success", message: "Attendance checked in." });
    } catch (error) {
      setAttendanceStatus({ type: "error", message: error.message });
    }
  }

  return (
    <section className={`live-class-access ${meetingOpen ? "is-open" : ""}`} aria-label="Live class access">
      <div className="live-class-heading">
        <span>{meetingOpen ? "Live classroom open" : "Next live class"}</span>
        <strong>{meetingOpen ? status.activeLabel : status.nextLabel}</strong>
      </div>

      {countdown && (
        <div className="live-class-countdown" aria-hidden="true">
          <span>{meetingOpen && status.secondsUntilStart <= 0 ? "Session status" : "Starts in"}</span>
          <strong>{countdown}</strong>
        </div>
      )}

      {preferredSession && (
        <p className="live-class-preference">Your selected session: {preferredSession}</p>
      )}

      {meetingOpen ? (
        <div className="live-class-actions">
          <a className="button live-class-button" href={liveClasses.meetingUrl} target="_blank" rel="noopener noreferrer" aria-label={`Join ${status.activeSession.label} on Google Meet`}>Join Class on Google Meet</a>
          <button className="button attendance-checkin-button" type="button" onClick={checkInAttendance} disabled={attendanceStatus.type === "success"}>{attendanceStatus.type === "success" ? "Attendance Recorded" : "Check In Attendance"}</button>
        </div>
      ) : (
        <p className="live-class-note">
          The join button appears 10 minutes before the 10 AM, 4 PM, and 8 PM sessions.
        </p>
      )}
      {attendanceStatus.message && <p className={`attendance-checkin-status ${attendanceStatus.type}`} role="status">{attendanceStatus.message}</p>}
    </section>
  );
}
