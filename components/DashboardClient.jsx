"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { academyData } from "../lib/academyData";
import { ConnectionStatus } from "./AppRuntime";

const defaultState = {
  profile: {
    displayName: "",
    studentId: "",
    paymentStatus: "Not confirmed",
    preferredSession: "Morning (10 AM)"
  },
  completedModules: [],
  quizResults: {},
  updatedAt: ""
};

function readState() {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(academyData.storageKey) || "{}");
    return {
      ...defaultState,
      ...saved,
      profile: {
        ...defaultState.profile,
        ...(saved.profile || {})
      },
      completedModules: Array.isArray(saved.completedModules) ? saved.completedModules : [],
      quizResults: saved.quizResults && typeof saved.quizResults === "object" ? saved.quizResults : {}
    };
  } catch (error) {
    return defaultState;
  }
}

function writeState(state) {
  localStorage.setItem(academyData.storageKey, JSON.stringify({
    ...state,
    updatedAt: new Date().toISOString()
  }));
}

export default function DashboardClient() {
  const [studentState, setStudentState] = useState(defaultState);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setStudentState(readState());
  }, []);

  const completedSet = useMemo(() => new Set(studentState.completedModules), [studentState.completedModules]);
  const completedCount = academyData.modules.filter((module) => completedSet.has(module.id)).length;
  const progressPercent = academyData.modules.length === 0 ? 0 : Math.round((completedCount / academyData.modules.length) * 100);
  const nextModule = academyData.modules.find((module) => !completedSet.has(module.id)) || academyData.modules[academyData.modules.length - 1];
  const quizCount = Object.keys(studentState.quizResults || {}).length;

  function updateProfile(field, value) {
    setStudentState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [field]: value
      }
    }));
  }

  function saveDashboard(event) {
    event.preventDefault();
    writeState(studentState);
    setSaveStatus("Dashboard saved on this device.");
  }

  function toggleModule(moduleId) {
    setStudentState((current) => {
      const nextCompleted = new Set(current.completedModules);

      if (nextCompleted.has(moduleId)) {
        nextCompleted.delete(moduleId);
      } else {
        nextCompleted.add(moduleId);
      }

      const nextState = {
        ...current,
        completedModules: Array.from(nextCompleted)
      };

      writeState(nextState);
      setSaveStatus("Progress saved on this device.");
      return nextState;
    });
  }

  function resetProgress() {
    const nextState = {
      ...studentState,
      completedModules: []
    };

    writeState(nextState);
    setStudentState(nextState);
    setSaveStatus("Progress reset on this device.");
  }

  return (
    <>
      <section className="dashboard-hero section-band">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Student App Dashboard</p>
          <h1>Track classes, modules, announcements, and progress.</h1>
          <p>
            This dashboard is the first app-ready layer for the academy. It works online, saves progress on this device, and keeps the backend path open for future cloud sync.
          </p>
          <div className="dashboard-status-row" aria-label="App status">
            <ConnectionStatus />
            <span className="status-pill is-online">Local progress ready</span>
            <span className="status-pill is-online">Next.js PWA foundation</span>
          </div>
          <div className="hero-actions">
            <Link className="button primary" href="/quiz">Take Module Quiz</Link>
            <Link className="button secondary" href="/register">Register Student</Link>
            <button className="button secondary" type="button" data-install-app hidden>Install App</button>
          </div>
        </div>
        <aside className="next-class-panel" aria-label="Next class schedule">
          <span>Regular Class Days</span>
          <strong>{academyData.academy.classDays.join(", ")}</strong>
          <p>{academyData.academy.arrangedDaysNote}</p>
          <div className="class-day-list">
            {academyData.academy.classDays.map((day) => <strong key={day}>{day}</strong>)}
          </div>
        </aside>
      </section>

      <section className="dashboard-section section-band light">
        <div className="dashboard-layout">
          <aside className="student-profile-panel">
            <form onSubmit={saveDashboard}>
              <div className="panel-heading">
                <span>Student Profile</span>
                <strong>{studentState.profile.displayName || "New Student"}</strong>
              </div>
              <label>
                <span>Display Name</span>
                <input
                  type="text"
                  name="displayName"
                  placeholder="Your name"
                  value={studentState.profile.displayName}
                  onChange={(event) => updateProfile("displayName", event.target.value)}
                />
              </label>
              <label>
                <span>Student ID</span>
                <input
                  type="text"
                  name="studentId"
                  placeholder="EFF-AI-2026-001"
                  value={studentState.profile.studentId}
                  onChange={(event) => updateProfile("studentId", event.target.value)}
                />
              </label>
              <label>
                <span>Payment Status</span>
                <select
                  name="paymentStatus"
                  value={studentState.profile.paymentStatus}
                  onChange={(event) => updateProfile("paymentStatus", event.target.value)}
                >
                  <option value="Not confirmed">Not confirmed</option>
                  <option value="Paid - Proof Uploaded">Paid - Proof Uploaded</option>
                  <option value="Grace Period">Grace Period</option>
                  <option value="Discuss Payment">Discuss Payment</option>
                </select>
              </label>
              <label>
                <span>Preferred Session</span>
                <select
                  name="preferredSession"
                  value={studentState.profile.preferredSession}
                  onChange={(event) => updateProfile("preferredSession", event.target.value)}
                >
                  <option value="Morning (10 AM)">Morning (10 AM)</option>
                  <option value="Evening (4 PM)">Evening (4 PM)</option>
                  <option value="Night (8 PM if introduced)">Night (8 PM if introduced)</option>
                </select>
              </label>
              <button className="button primary" type="submit">Save Dashboard</button>
              <button className="button ghost-button" type="button" onClick={resetProgress}>Reset Progress</button>
              <p className="save-note" role="status" aria-live="polite">{saveStatus}</p>
            </form>
          </aside>

          <div className="dashboard-main">
            <div className="dashboard-metrics" aria-label="Student progress metrics">
              <article>
                <span>Progress</span>
                <strong>{progressPercent}%</strong>
                <p>{completedCount} of {academyData.modules.length} modules complete</p>
              </article>
              <article>
                <span>Next Module</span>
                <strong>{nextModule?.title || "All modules complete"}</strong>
                <p>{nextModule?.task || "Prepare final project evidence."}</p>
              </article>
              <article>
                <span>Payment</span>
                <strong>{studentState.profile.paymentStatus}</strong>
                <p>Saved locally until backend sync is added.</p>
              </article>
              <article>
                <span>Quizzes</span>
                <strong>{quizCount}</strong>
                <p>Saved from this device after quiz submission.</p>
              </article>
            </div>

            <section className="dashboard-card">
              <div className="dashboard-card-heading">
                <div>
                  <span>Announcements</span>
                  <h2>Important updates</h2>
                </div>
                <Link className="mini-link" href="/#announcements">Homepage board</Link>
              </div>
              <div className="announcement-list">
                {academyData.announcements.map((announcement) => (
                  <article key={announcement.id}>
                    <span>{announcement.label}</span>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-card">
              <div className="dashboard-card-heading">
                <div>
                  <span>Lesson Progress</span>
                  <h2>30-day module path</h2>
                </div>
                <Link className="mini-link" href="/quiz">Module quiz</Link>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="module-progress-list">
                {academyData.modules.map((module) => {
                  const complete = completedSet.has(module.id);
                  return (
                    <article key={module.id} className={complete ? "is-complete" : ""}>
                      <label>
                        <input
                          type="checkbox"
                          checked={complete}
                          onChange={() => toggleModule(module.id)}
                        />
                        <span>
                          <b>{module.dayRange}</b>
                          <strong>{module.title}</strong>
                          <small>{module.summary}</small>
                          <em>{module.task}</em>
                        </span>
                      </label>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-card backend-card">
              <div className="dashboard-card-heading">
                <div>
                  <span>Backend Roadmap</span>
                  <h2>Supabase slot reserved for later.</h2>
                </div>
                <strong className="backend-badge">Not active yet</strong>
              </div>
              <p>
                Current storage uses this device plus the existing Google Apps Script endpoints. When the academy starts making enough money, this reserved layer can connect student login, synced progress, certificates, payments, and an admin dashboard.
              </p>
              <div className="backend-grid">
                {Object.entries(academyData.backend.providers).map(([key, provider]) => (
                  <article key={key} className={provider.status === "reserved" ? "is-reserved" : ""}>
                    <span>{provider.status}</span>
                    <h3>{provider.label}</h3>
                    <p>{provider.purpose}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
