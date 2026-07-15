"use client";

import { useEffect, useState } from "react";
import { academyData } from "../lib/academyData";
import { getLiveClassStatus } from "../lib/liveClassSchedule";

const refreshInterval = 15 * 1000;

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

  return (
    <section className={`live-class-access ${meetingOpen ? "is-open" : ""}`} aria-live="polite">
      <div className="live-class-heading">
        <span>{meetingOpen ? "Live classroom open" : "Next live class"}</span>
        <strong>{meetingOpen ? status.activeLabel : status.nextLabel}</strong>
      </div>

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
