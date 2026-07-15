"use client";

import { useEffect, useState } from "react";
import { academyData } from "../lib/academyData";

export default function ManagedAnnouncements({ className = "announcement-list" }) {
  const [announcements, setAnnouncements] = useState(academyData.announcements);

  useEffect(() => {
    let active = true;

    fetch("/api/announcements", { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((result) => {
        if (active && result.ok && Array.isArray(result.announcements)) {
          setAnnouncements(result.announcements);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={className}>
      {announcements.map((announcement) => (
        <article key={announcement.id} className={className === "announcement-board-list" ? "announcement-card" : ""}>
          <span>{announcement.label}</span>
          <h3>{announcement.title}</h3>
          <p>{announcement.detail}</p>
        </article>
      ))}
    </div>
  );
}
