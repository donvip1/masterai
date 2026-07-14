"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  clearStudentSession,
  readStudentSession,
  writeStudentSession
} from "../lib/studentSession";

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

function formatRemaining(milliseconds) {
  if (milliseconds <= 0) {
    return "Ready for refresh";
  }

  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

export default function QuizClient() {
  const [accessReady, setAccessReady] = useState(false);
  const [session, setSession] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const savedSession = readStudentSession();
    setSession(savedSession);
    setAccessReady(true);

    if (savedSession) {
      loadQuiz(savedSession.studentId);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadQuiz(studentId, options = {}) {
    setLoading(true);

    if (!options.preserveStatus) {
      setStatus({ type: "", message: "" });
    }

    try {
      const response = await fetch(`/api/quiz?studentId=${encodeURIComponent(studentId)}`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Quiz access could not be loaded.");
      }

      setQuizData(data);
      setAnswers({});

      if (data.student) {
        setSession((current) => {
          const nextSession = writeStudentSession({
            ...(current?.profile || {}),
            ...data.student
          });
          return nextSession;
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Quiz access could not be loaded."
      });
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    clearStudentSession();
    setSession(null);
    setQuizData(null);
    setAnswers({});
    setResult(null);
  }

  const currentModule = quizData?.module || null;
  const quizState = quizData?.quizState || null;
  const questionCount = currentModule?.questions?.length || 0;
  const nextAttemptTime = quizState?.nextAttemptAt ? new Date(quizState.nextAttemptAt).getTime() : 0;
  const remainingMilliseconds = nextAttemptTime ? nextAttemptTime - now : 0;
  const canAttempt = Boolean(quizState?.canAttempt && currentModule && questionCount > 0);
  const answeredCount = useMemo(
    () => currentModule?.questions?.filter((question) => answers[question.id]).length || 0,
    [answers, currentModule]
  );

  function validate() {
    if (!session?.studentId) {
      return "Sign in from the dashboard before taking a quiz.";
    }

    if (!currentModule || !canAttempt) {
      return quizState?.lockReason || "This module is not available yet.";
    }

    if (currentModule.questions.some((question) => !answers[question.id])) {
      return "Answer every objective question before submitting.";
    }

    return "";
  }

  async function submitQuiz(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    const payload = {
      studentId: session.studentId,
      moduleId: currentModule.id,
      answers: currentModule.questions.map((question) => ({
        questionId: question.id,
        selectedAnswer: answers[question.id]
      })),
      quizWebsite: "",
      pageUrl: window.location.href
    };

    setSubmitting(true);
    setStatus({ type: "success", message: "Submitting your quiz..." });

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const apiResult = await response.json().catch(() => ({}));

      if (!response.ok || !apiResult.ok) {
        if (apiResult.quizState) {
          setQuizData((current) => current ? { ...current, quizState: apiResult.quizState } : current);
        }
        throw new Error(apiResult.message || "Quiz could not be submitted.");
      }

      setResult(apiResult);
      setAnswers({});
      setStatus({
        type: "success",
        message: apiResult.passed
          ? "Quiz passed. Your next module opens after 48 hours."
          : "Quiz submitted. Correction access opens after 30 minutes."
      });
      await loadQuiz(session.studentId, { preserveStatus: true });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again or contact the academy."
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!accessReady) {
    return <div className="quiz-access-card">Checking student access...</div>;
  }

  if (!session) {
    return (
      <div className="quiz-access-card">
        <p className="eyebrow">Student Login Required</p>
        <h2>Only signed-in students can access module quizzes.</h2>
        <p>Open the dashboard and sign in with the Student ID issued after registration.</p>
        <Link className="button primary" href="/dashboard">Go to Dashboard Login</Link>
      </div>
    );
  }

  return (
    <form className="quiz-form" onSubmit={submitQuiz} noValidate>
      <input type="text" name="quizWebsite" className="honeypot" tabIndex="-1" autoComplete="off" aria-hidden="true" />

      <div className="quiz-student-bar">
        <div>
          <span>Signed-in Student</span>
          <strong>{quizData?.student?.fullName || session.profile?.fullName || "Registered Student"}</strong>
          <p>{session.studentId}</p>
        </div>
        <div className="quiz-student-actions">
          <Link className="mini-link" href="/dashboard">Dashboard</Link>
          <button className="mini-link" type="button" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {loading && <div className="quiz-loading">Loading your current module...</div>}

      {quizData && (
        <>
          <div className="quiz-top">
            <div className="quiz-current-module">
              <span>Current Module · Cycle {quizState.cycle}</span>
              <h2>{currentModule?.title || "Module access pending"}</h2>
              <p>
                {canAttempt
                  ? `${questionCount} objective questions are available. ${answeredCount} answered.`
                  : quizState.lockReason || "Your current module is temporarily locked."}
              </p>
            </div>

            <aside className={`quiz-summary ${canAttempt ? "is-available" : "is-locked"}`} aria-live="polite">
              <span>{canAttempt ? "Available Now" : "Assessment Locked"}</span>
              <strong>{canAttempt ? "Ready to begin" : formatRemaining(remainingMilliseconds)}</strong>
              <p>
                {canAttempt
                  ? "Complete every question and submit once."
                  : `Next access: ${formatDateTime(quizState.nextAttemptAt)}`}
              </p>
              {!canAttempt && (
                <button className="button ghost-button" type="button" onClick={() => loadQuiz(session.studentId)} disabled={loading}>
                  Refresh Access
                </button>
              )}
            </aside>
          </div>

          {canAttempt && (
            <div className="quiz-questions">
              {currentModule.questions.map((question, questionIndex) => (
                <article className="quiz-question-card" key={question.id}>
                  <h3>{questionIndex + 1}. {question.question}</h3>
                  <div className="quiz-options">
                    {question.options.map((option) => (
                      <label key={option}>
                        <input
                          type="radio"
                          name={`quiz_${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                          required
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="quiz-footer">
            {canAttempt && (
              <button className="button primary quiz-submit" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Current Module"}
              </button>
            )}
            <div className="quiz-result" aria-live="polite">
              {result && (
                <>
                  <strong>Score: {result.score}/{result.total} ({result.percentage}%)</strong>
                  <span>{result.passed ? "Passed. Next module in 48 hours." : "Correction available in 30 minutes."}</span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {status.message && <div className={`form-status is-visible ${status.type}`} role="status" aria-live="polite">{status.message}</div>}
    </form>
  );
}
