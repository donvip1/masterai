"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { academyData } from "../lib/academyData";
import { quizCatalog } from "../lib/quizCatalog";
import {
  clearStudentSession,
  normalizeStudentId,
  readRecentStudentId,
  readStudentSession,
  writeStudentSession
} from "../lib/studentSession";
import { ConnectionStatus } from "./AppRuntime";
import LiveClassAccess from "./LiveClassAccess";

const emptyQuizState = {
  cycle: 1,
  allowedModuleId: "module-0",
  completedModules: [],
  completedCount: 0,
  totalModules: quizCatalog.length,
  progressPercent: 0,
  attemptsCount: 0,
  totalAttemptsCount: 0,
  results: {},
  latestResult: null,
  canAttempt: true,
  nextAttemptAt: "",
  lockReason: ""
};

function formatNaira(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `₦${amount.toLocaleString("en-NG")}` : "Not available";
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function requestStudentProfile(studentId) {
  const response = await fetch("/api/student", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ studentId })
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok || !result.student) {
    throw new Error(result.message || "Student ID could not be verified.");
  }

  return result.student;
}

export default function DashboardClient() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [loginStatus, setLoginStatus] = useState({ type: "", message: "" });
  const [signingIn, setSigningIn] = useState(false);
  const [quizState, setQuizState] = useState(emptyQuizState);
  const [quizStatus, setQuizStatus] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    const savedSession = readStudentSession();
    const recentStudentId = readRecentStudentId();
    const registered = new URLSearchParams(window.location.search).get("registered") === "1";

    if (registered) {
      setLoginStatus({
        type: "success",
        message: "Registration complete. Your Student ID is prefilled below. Sign in to open your dashboard."
      });
    }

    async function restoreAccess() {
      if (!savedSession) {
        if (recentStudentId) {
          setStudentId(recentStudentId);
        }

        setAuthReady(true);
        return;
      }

      setStudentId(savedSession.studentId);

      try {
        const verifiedProfile = await requestStudentProfile(savedSession.studentId);
        const nextSession = writeStudentSession({
          ...(savedSession.profile || {}),
          ...verifiedProfile
        });

        setSession(nextSession);
        await loadQuizStatus(nextSession.studentId);
      } catch (error) {
        clearStudentSession();
        setLoginStatus({
          type: "error",
          message: error.message || "Your saved Student ID session could not be verified. Sign in again."
        });
      } finally {
        setAuthReady(true);
      }
    }

    restoreAccess();
  }, []);

  async function loadQuizStatus(activeStudentId) {
    setLoadingProgress(true);
    setQuizStatus("");

    try {
      const response = await fetch(`/api/quiz?studentId=${encodeURIComponent(activeStudentId)}`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Progress could not be loaded.");
      }

      setQuizState({
        ...emptyQuizState,
        ...result.quizState
      });

      if (result.student) {
        setSession((current) => {
          const nextProfile = {
            ...(current?.profile || {}),
            ...result.student
          };
          return writeStudentSession(nextProfile);
        });
      }
    } catch (error) {
      setQuizStatus(error.message || "Progress could not be loaded.");
    } finally {
      setLoadingProgress(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const normalizedStudentId = normalizeStudentId(studentId);

    if (!normalizedStudentId) {
      setLoginStatus({ type: "error", message: "Enter your Student ID." });
      return;
    }

    setSigningIn(true);
    setLoginStatus({ type: "", message: "" });

    try {
      const profile = await requestStudentProfile(normalizedStudentId);
      const nextSession = writeStudentSession(profile);
      setSession(nextSession);
      setStudentId(nextSession.studentId);
      setLoginStatus({ type: "", message: "" });
      await loadQuizStatus(nextSession.studentId);
    } catch (error) {
      setLoginStatus({
        type: "error",
        message: error.message || "Student ID could not be verified."
      });
    } finally {
      setSigningIn(false);
    }
  }

  function signOut() {
    clearStudentSession();
    setSession(null);
    setQuizState(emptyQuizState);
    setQuizStatus("");
    setLoginStatus({ type: "", message: "" });
  }

  const completedSet = useMemo(
    () => new Set(quizState.completedModules || []),
    [quizState.completedModules]
  );
  const currentModule = quizCatalog.find((module) => module.id === quizState.allowedModuleId) || quizCatalog[0];
  const profile = session?.profile || {};
  const latestResult = quizState.latestResult;
  const nextAttemptLabel = formatDateTime(quizState.nextAttemptAt);
  const adminSocialUrl = `https://x.com/${academyData.academy.contact.social.replace("@", "")}`;

  if (!authReady) {
    return (
      <section className="student-access section-band standalone-page">
        <div className="auth-loading">Loading student access...</div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="student-access section-band standalone-page">
        <div className="student-access-layout">
          <div className="student-access-copy">
            <p className="eyebrow">Student Access</p>
            <h1>Open your academy dashboard.</h1>
            <p>
              Registered students sign in with the Student ID issued after registration. Your profile, quiz progress, performance, and module access are loaded from the academy records.
            </p>
            <div className="access-benefits" aria-label="Dashboard benefits">
              <span>Progress tracking</span>
              <span>Quiz performance</span>
              <span>Module access</span>
              <span>Class updates</span>
            </div>
          </div>

          <form className="student-login-card" onSubmit={signIn}>
            <div>
              <p className="eyebrow">Dashboard Login</p>
              <h2>Enter your Student ID</h2>
              <p>Use the ID shown after registration or sent to your email.</p>
            </div>
            <label>
              <span>Student ID</span>
              <input
                type="text"
                value={studentId}
                onChange={(event) => setStudentId(normalizeStudentId(event.target.value))}
                placeholder="EFF-AI-2026-001"
                autoComplete="username"
                required
              />
            </label>
            <button className="button primary" type="submit" disabled={signingIn}>
              {signingIn ? "Checking ID..." : "Sign In"}
            </button>

            {loginStatus.message && (
              <div className={`form-status is-visible ${loginStatus.type}`} role="status">
                {loginStatus.message}
              </div>
            )}

            <details className="id-recovery">
              <summary>Forgot your Student ID?</summary>
              <p>
                Contact an admin with the full name, phone number, WhatsApp number, or email address used during registration.
              </p>
              <div className="recovery-actions">
                <a className="button ghost-button" href={academyData.academy.contact.whatsapp} target="_blank" rel="noreferrer">
                  Request on WhatsApp
                </a>
                <a className="button ghost-button" href={adminSocialUrl} target="_blank" rel="noreferrer">
                  Send Admin a DM
                </a>
                <a className="mini-link" href={`mailto:${academyData.academy.contact.email}?subject=EFF Academy Student ID Recovery`}>
                  Email admin
                </a>
              </div>
            </details>

            <p className="login-register-note">
              Not registered yet? <Link href="/register">Complete registration</Link>
            </p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="dashboard-hero section-band">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Student Dashboard · Cycle {quizState.cycle}</p>
          <h1>Welcome, {profile.fullName || "student"}.</h1>
          <p>
            Track your class modules, quiz performance, announcements, and the next available assessment from one student account.
          </p>
          <div className="dashboard-status-row" aria-label="Student status">
            <ConnectionStatus />
            <span className="status-pill is-online">{profile.registrationStatus || "Registered"}</span>
            <span className="status-pill is-online">{profile.paymentStatus || "Payment pending"}</span>
          </div>
          <div className="hero-actions">
            <Link className="button primary" href="/quiz">Open Current Quiz</Link>
            <button className="button secondary" type="button" onClick={signOut}>Sign Out</button>
          </div>
        </div>
        <aside className="next-class-panel" aria-label="Next class schedule">
          <span>Regular Class Days</span>
          <strong>{academyData.academy.classDays.join(", ")}</strong>
          <p>{academyData.academy.arrangedDaysNote}</p>
          <div className="class-day-list">
            {academyData.academy.classDays.map((day) => <strong key={day}>{day}</strong>)}
          </div>
          <LiveClassAccess preferredSession={profile.preferredSession} />
        </aside>
      </section>

      <section className="dashboard-section section-band light">
        <div className="dashboard-layout">
          <aside className="student-profile-panel">
            <section className="student-profile-card">
              <div className="panel-heading">
                <span>Student Profile</span>
                <strong>{profile.fullName || "Registered Student"}</strong>
              </div>
              <dl className="student-profile-details">
                <div><dt>Student ID</dt><dd>{session.studentId}</dd></div>
                <div><dt>Payment</dt><dd>{profile.paymentStatus || "Not confirmed"}</dd></div>
                <div><dt>Session</dt><dd>{profile.preferredSession || "Not selected"}</dd></div>
                <div><dt>Occupation</dt><dd>{profile.occupation || "Not provided"}</dd></div>
                <div><dt>Course Fee</dt><dd>{formatNaira(profile.courseFee)}</dd></div>
              </dl>
              <button className="button ghost-button" type="button" onClick={() => loadQuizStatus(session.studentId)} disabled={loadingProgress}>
                {loadingProgress ? "Refreshing..." : "Refresh Progress"}
              </button>
              <button className="button ghost-button" type="button" onClick={signOut}>Sign Out</button>
            </section>
          </aside>

          <div className="dashboard-main">
            {quizStatus && <div className="form-status is-visible error">{quizStatus}</div>}

            <div className="dashboard-metrics" aria-label="Student progress metrics">
              <article>
                <span>Progress</span>
                <strong>{quizState.progressPercent}%</strong>
                <p>{quizState.completedCount} of {quizState.totalModules} modules passed in cycle {quizState.cycle}</p>
              </article>
              <article>
                <span>Current Module</span>
                <strong>{currentModule.title}</strong>
                <p>{currentModule.dayRange}</p>
              </article>
              <article>
                <span>Latest Score</span>
                <strong>{latestResult ? `${latestResult.percentage}%` : "No attempt"}</strong>
                <p>{latestResult ? latestResult.result : "Take your first module quiz."}</p>
              </article>
              <article>
                <span>Attempts</span>
                <strong>{quizState.totalAttemptsCount}</strong>
                <p>{quizState.canAttempt ? "Current quiz is available." : `Next access: ${nextAttemptLabel}`}</p>
              </article>
            </div>

            {!quizState.canAttempt && (
              <section className="dashboard-card cooldown-card">
                <div>
                  <span>Assessment Cooldown</span>
                  <h2>{quizState.lockReason}</h2>
                  <p>Your next quiz access is scheduled for {nextAttemptLabel}.</p>
                </div>
                <Link className="button primary" href="/quiz">View Quiz Status</Link>
              </section>
            )}

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
                  <span>Quiz Progress</span>
                  <h2>Module performance path</h2>
                </div>
                <Link className="mini-link" href="/quiz">Current quiz</Link>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${quizState.progressPercent}%` }} />
              </div>
              <div className="module-progress-list">
                {quizCatalog.map((module) => {
                  const result = quizState.results?.[module.id];
                  const complete = completedSet.has(module.id);
                  const current = module.id === quizState.allowedModuleId;
                  const failed = result?.result === "Needs Review";
                  const status = complete
                    ? `Passed · ${result.percentage}%`
                    : failed
                      ? `Correction required · ${result.percentage}%`
                      : current
                        ? quizState.canAttempt ? "Available now" : "Current module · waiting"
                        : "Locked";

                  return (
                    <article
                      key={module.id}
                      className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""} ${failed ? "is-failed" : ""}`.trim()}
                    >
                      <div className="module-progress-content">
                        <span>
                          <b>{module.dayRange}</b>
                          <strong>{module.title}</strong>
                          <small>Cycle {quizState.cycle}</small>
                          <em>{status}</em>
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-card backend-card">
              <div className="dashboard-card-heading">
                <div>
                  <span>Student Records</span>
                  <h2>Google Sheets sync is active.</h2>
                </div>
                <strong className="backend-badge">Server checked</strong>
              </div>
              <p>
                Registration details remain in the academy database and are reused for quiz records, performance review, future certificates, and admin follow-up. Students no longer repeat their contact details for every assessment.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
