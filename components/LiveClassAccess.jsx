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

export default function LiveClassAccess({ preferredSession = "" }) {
  const [currentTime, setCurrentTime] = useState(null);
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
        <a
          className="button live-class-button"
          href={liveClasses.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Join ${status.activeSession.label} on Google Meet`}
        >
          Join Class on Google Meet
        </a>
      ) : (
        <p className="live-class-note">
          The join button appears 10 minutes before the 10 AM, 4 PM, and 8 PM sessions.
        </p>
      )}
    </section>
  );
}
