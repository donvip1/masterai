"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  blobToDataUrl,
  createModuleReport,
  createWhatsAppMessage
} from "../lib/moduleReport";
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
  const [moduleReport, setModuleReport] = useState(null);
  const [reportStatus, setReportStatus] = useState({ type: "", message: "" });
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

  useEffect(() => {
    return () => {
      if (moduleReport?.previewUrl) {
        URL.revokeObjectURL(moduleReport.previewUrl);
      }
    };
  }, [moduleReport?.previewUrl]);

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

    if (moduleReport?.previewUrl) {
      URL.revokeObjectURL(moduleReport.previewUrl);
    }

    setSession(null);
    setQuizData(null);
    setAnswers({});
    setResult(null);
    setModuleReport(null);
    setReportStatus({ type: "", message: "" });
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

  async function generateAndStoreReport(reportData) {
    if (!reportData) {
      setReportStatus({
        type: "error",
        message: "The quiz was saved, but report details were not returned by the server."
      });
      return;
    }

    setReportStatus({
      type: "success",
      message: "Generating your module task completion report..."
    });

    try {
      const generated = await createModuleReport(reportData);
      const previewUrl = URL.createObjectURL(generated.blob);
      const reportWithMotivation = {
        ...reportData,
        motivation: generated.motivation
      };

      setModuleReport((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }

        return {
          ...generated,
          previewUrl,
          reportData: reportWithMotivation,
          remote: null
        };
      });
      setReportStatus({
        type: "success",
        message: "Your PNG is ready. Saving the PNG and PDF copies to the academy records..."
      });

      try {
        const imageData = await blobToDataUrl(generated.blob);
        const response = await fetch("/api/module-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...reportWithMotivation,
            imageData,
            reportWebsite: "",
            pageUrl: window.location.href
          })
        });
        const savedReport = await response.json().catch(() => ({}));

        if (!response.ok || !savedReport.ok || !savedReport.report) {
          throw new Error(savedReport.message || "The academy copy could not be stored.");
        }

        setModuleReport((current) => current ? {
          ...current,
          remote: savedReport.report
        } : current);
        setReportStatus({
          type: "success",
          message: savedReport.report.emailStatus === "Sent"
            ? "Report generated, stored in Drive, and emailed successfully."
            : "Report generated and stored in Drive. The email delivery status is shown below."
        });
      } catch (error) {
        setReportStatus({
          type: "warning",
          message: error.message || "The academy copy could not be stored. Your local PNG is still ready."
        });
      }
    } catch (error) {
      setReportStatus({
        type: "error",
        message: error.message || "The quiz was saved, but the report image could not be generated."
      });
    }
  }

  async function shareReport() {
    if (!moduleReport) {
      return;
    }

    const shareText = createWhatsAppMessage(
      moduleReport.reportData,
      moduleReport.remote?.pngDownloadUrl || ""
    );

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [moduleReport.file] })
      ) {
        await navigator.share({
          title: "Module Task Completion Report",
          text: shareText,
          files: [moduleReport.file]
        });
        return;
      }

      const whatsappUrl = moduleReport.remote?.whatsappUrl ||
        `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error?.name !== "AbortError") {
        setReportStatus({
          type: "warning",
          message: "The share window could not be opened. Download the report and share the PNG directly."
        });
      }
    }
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
      await Promise.all([
        loadQuiz(session.studentId, { preserveStatus: true }),
        generateAndStoreReport(apiResult.report)
      ]);
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

          {moduleReport && (
            <section className="module-report-panel" aria-labelledby="module-report-title">
              <div className="module-report-heading">
                <div>
                  <span>Automatic Progress Report</span>
                  <h2 id="module-report-title">Module task completion report</h2>
                  <p>This acknowledges one module attempt. It is not a graduation certificate.</p>
                </div>
                <strong className={moduleReport.reportData.passed ? "report-pass" : "report-review"}>
                  {moduleReport.reportData.passed ? "Passed" : "Needs Improvement"}
                </strong>
              </div>

              <div className="module-report-layout">
                <a
                  className="module-report-preview"
                  href={moduleReport.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View the full module task completion report"
                >
                  <img
                    src={moduleReport.previewUrl}
                    alt={`Module task completion report for ${moduleReport.reportData.moduleName}`}
                  />
                </a>

                <div className="module-report-actions">
                  <a
                    className="button primary"
                    href={moduleReport.previewUrl}
                    download={moduleReport.fileName}
                  >
                    Download Report
                  </a>
                  <a
                    className="button secondary"
                    href={moduleReport.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Report
                  </a>
                  <button className="button ghost-button" type="button" onClick={shareReport}>
                    Share Report
                  </button>

                  {moduleReport.remote?.pdfDownloadUrl && (
                    <a
                      className="button ghost-button"
                      href={moduleReport.remote.pdfDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download PDF
                    </a>
                  )}

                  {moduleReport.remote?.whatsappUrl && (
                    <a
                      className="button whatsapp-button"
                      href={moduleReport.remote.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Share to WhatsApp
                    </a>
                  )}

                  <dl className="module-report-meta">
                    <div>
                      <dt>File</dt>
                      <dd>{moduleReport.fileName}</dd>
                    </div>
                    <div>
                      <dt>Drive status</dt>
                      <dd>{moduleReport.remote?.status || "Saving..."}</dd>
                    </div>
                    <div>
                      <dt>Email status</dt>
                      <dd>{moduleReport.remote?.emailStatus || "Waiting for Drive..."}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
          )}

          {reportStatus.message && (
            <div className={`form-status is-visible ${reportStatus.type}`} role="status" aria-live="polite">
              {reportStatus.message}
            </div>
          )}
        </>
      )}

      {status.message && <div className={`form-status is-visible ${status.type}`} role="status" aria-live="polite">{status.message}</div>}
    </form>
  );
}
