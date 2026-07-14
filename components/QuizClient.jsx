"use client";

import { useMemo, useState } from "react";
import quizModules from "../quiz-data";
import { academyData } from "../lib/academyData";

function readDashboardState() {
  try {
    return JSON.parse(localStorage.getItem(academyData.storageKey) || "{}");
  } catch (error) {
    return {};
  }
}

function recordQuizResult(moduleId, result) {
  try {
    const state = readDashboardState();
    const quizResults = state.quizResults && typeof state.quizResults === "object" ? state.quizResults : {};
    localStorage.setItem(academyData.storageKey, JSON.stringify({
      ...state,
      quizResults: {
        ...quizResults,
        [moduleId]: {
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          passed: Boolean(result.passed),
          submittedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {}
}

export default function QuizClient() {
  const [student, setStudent] = useState({
    fullName: "",
    whatsappNumber: "",
    emailAddress: "",
    studentId: ""
  });
  const [moduleId, setModuleId] = useState("");
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const currentModule = useMemo(() => quizModules.find((module) => module.id === moduleId) || null, [moduleId]);

  function updateStudent(field, value) {
    setStudent((current) => ({
      ...current,
      [field]: value
    }));
  }

  function selectModule(value) {
    setModuleId(value);
    setAnswers({});
    setResult(null);
    setStatus({ type: "", message: "" });
  }

  function validate() {
    if (!student.fullName || !student.whatsappNumber || !student.emailAddress) {
      return "Enter your name, WhatsApp number, and email address.";
    }

    if (!currentModule) {
      return "Select a module before submitting the quiz.";
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
      submissionType: "quiz",
      fullName: student.fullName.trim(),
      whatsappNumber: student.whatsappNumber.trim(),
      emailAddress: student.emailAddress.trim(),
      studentId: student.studentId.trim(),
      moduleId: currentModule.id,
      moduleTitle: currentModule.title,
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
        throw new Error(apiResult.message || "Quiz could not be submitted.");
      }

      setResult(apiResult);
      recordQuizResult(payload.moduleId, apiResult);
      setStatus({ type: "success", message: "Your quiz result has been submitted to the academy." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Something went wrong. Please try again or contact the academy." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="quiz-form" onSubmit={submitQuiz} noValidate>
      <input type="text" name="quizWebsite" className="honeypot" tabIndex="-1" autoComplete="off" aria-hidden="true" />

      <div className="quiz-top">
        <div className="quiz-fields">
          <label>
            <span>Full Name *</span>
            <input type="text" value={student.fullName} onChange={(event) => updateStudent("fullName", event.target.value)} required />
          </label>
          <label>
            <span>WhatsApp Number *</span>
            <input type="tel" value={student.whatsappNumber} onChange={(event) => updateStudent("whatsappNumber", event.target.value)} required />
          </label>
          <label>
            <span>Email Address *</span>
            <input type="email" value={student.emailAddress} onChange={(event) => updateStudent("emailAddress", event.target.value)} required />
          </label>
          <label>
            <span>Student ID</span>
            <input type="text" value={student.studentId} onChange={(event) => updateStudent("studentId", event.target.value)} placeholder="EFF-AI-2026-001" />
          </label>
          <label className="quiz-module-select">
            <span>Select Module *</span>
            <select value={moduleId} onChange={(event) => selectModule(event.target.value)} required>
              <option value="">Choose a module</option>
              {quizModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </label>
        </div>

        <aside className="quiz-summary" aria-live="polite">
          <span>Current Test</span>
          <strong>{currentModule ? currentModule.title : "No module selected"}</strong>
          <p>{currentModule ? `${currentModule.questions.length} objective questions. Your result will be submitted to the academy sheet.` : "Choose a module to load its objective questions."}</p>
        </aside>
      </div>

      <div className="quiz-questions">
        {!currentModule && <p className="quiz-empty">Select a module above to begin.</p>}
        {currentModule?.questions.map((question, questionIndex) => (
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

      <div className="quiz-footer">
        <button className="button primary quiz-submit" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Quiz"}</button>
        <div className="quiz-result" aria-live="polite">
          {result && (
            <>
              <strong>Score: {result.score}/{result.total} ({result.percentage}%)</strong>
              <span>{result.passed ? "Passed and submitted." : "Submitted. Please review this module again."}</span>
            </>
          )}
        </div>
      </div>

      {status.message && <div className={`form-status is-visible ${status.type}`} role="status" aria-live="polite">{status.message}</div>}
    </form>
  );
}
