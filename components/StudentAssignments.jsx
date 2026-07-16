"use client";

import { useEffect, useMemo, useState } from "react";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || "Assignment request failed.");
  return result;
}

function formatAssignmentDate(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export default function StudentAssignments({ studentId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submissions, setSubmissions] = useState({});

  useEffect(() => {
    loadAssignments();
  }, [studentId]);

  async function loadAssignments() {
    if (!studentId) return;
    setLoading(true);
    try {
      const result = await requestJson(`/api/assignments?studentId=${encodeURIComponent(studentId)}`);
      setAssignments(result.assignments || []);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function updateAssignment(assignment, nextStatus) {
    const draft = submissions[assignment.assignmentId] || {};
    if (nextStatus === "submitted" && !String(draft.submission || assignment.submission || "").trim()) {
      setStatus({ type: "error", message: "Add a shareable project link or submission description before submitting." });
      return;
    }

    try {
      const result = await requestJson("/api/assignments", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          assignmentId: assignment.assignmentId,
          status: nextStatus,
          submission: draft.submission || assignment.submission || "",
          note: draft.note || assignment.note || ""
        })
      });
      setAssignments(result.assignments || []);
      setStatus({ type: "success", message: nextStatus === "submitted" ? "Project submitted for admin review." : "Assignment progress updated." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const summary = useMemo(() => ({
    total: assignments.length,
    active: assignments.filter((item) => ["assigned", "in-progress"].includes(item.status)).length,
    submitted: assignments.filter((item) => item.status === "submitted").length,
    completed: assignments.filter((item) => item.status === "completed").length
  }), [assignments]);

  return (
    <section className="dashboard-card student-assignment-center">
      <div className="dashboard-card-heading">
        <div><span>Practical Work</span><h2>Projects assigned by your instructor</h2></div>
        <button className="mini-link" type="button" onClick={loadAssignments} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>
      <div className="assignment-summary" aria-label="Assignment summary">
        <div><span>Total</span><strong>{summary.total}</strong></div>
        <div><span>Active</span><strong>{summary.active}</strong></div>
        <div><span>Submitted</span><strong>{summary.submitted}</strong></div>
        <div><span>Completed</span><strong>{summary.completed}</strong></div>
      </div>
      {status.message && <div className={`form-status is-visible ${status.type}`} role="status">{status.message}</div>}
      {!loading && assignments.length === 0 && <div className="assignment-empty"><strong>No project has been assigned yet.</strong><p>Your instructor&apos;s private project library will appear here only after a project is broadcast to you.</p></div>}
      <div className="student-assignment-list">
        {assignments.map((assignment) => {
          const draft = submissions[assignment.assignmentId] || {};
          return (
            <details key={assignment.assignmentId} className={`student-assignment-item status-${assignment.status}`} open={assignment.status === "assigned"}>
              <summary>
                <div><span>{assignment.moduleTitle}</span><strong>{assignment.title}</strong><small>Due: {formatAssignmentDate(assignment.dueDate)}</small></div>
                <b>{assignment.status.replace("-", " ")}</b>
              </summary>
              <div className="assignment-detail-body">
                <p>{assignment.summary}</p>
                <div className="assignment-meta"><span>{assignment.difficulty}</span><span>{assignment.estimatedMinutes} minutes</span><span>{assignment.tools}</span></div>
                <section><strong>Practical prompt</strong><p>{assignment.prompt}</p></section>
                <section><strong>Required deliverable</strong><p>{assignment.deliverable}</p></section>
                <section><strong>Steps</strong><ol>{assignment.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>

                {assignment.status === "assigned" && <button className="button primary" type="button" onClick={() => updateAssignment(assignment, "in-progress")}>Start Project</button>}
                {assignment.status === "in-progress" && (
                  <div className="assignment-submission-form">
                    <label><span>Project link or submission description</span><textarea rows="3" value={draft.submission ?? assignment.submission ?? ""} onChange={(event) => setSubmissions((current) => ({ ...current, [assignment.assignmentId]: { ...current[assignment.assignmentId], submission: event.target.value } }))} placeholder="Paste a Google Drive, Canva, website, video, or document link. You can also describe where the work was submitted." /></label>
                    <label><span>Note to your instructor</span><textarea rows="2" value={draft.note ?? assignment.note ?? ""} onChange={(event) => setSubmissions((current) => ({ ...current, [assignment.assignmentId]: { ...current[assignment.assignmentId], note: event.target.value } }))} placeholder="What did you learn, and where did you need help?" /></label>
                    <button className="button primary" type="button" onClick={() => updateAssignment(assignment, "submitted")}>Submit for Review</button>
                  </div>
                )}
                {assignment.status === "submitted" && <div className="assignment-review-state"><strong>Submitted for review</strong><p>Your instructor can open the submission from the admin dashboard and record completion.</p></div>}
                {assignment.status === "completed" && <div className="assignment-complete-state"><strong>Project completed</strong><p>This practical assignment has been accepted and recorded.</p></div>}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
