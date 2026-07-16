"use client";

import { useEffect, useMemo, useState } from "react";
import { practicalProjects } from "../lib/practicalProjects";

const ADMIN_EMAIL = "viplearn4free@gmail.com";
const emptyAnnouncement = { id: "", label: "", title: "", detail: "", active: true };

function safeSubmissionUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch (error) {
    return "";
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    const error = new Error(result.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return result;
}

export default function AdminDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({ summary: {}, students: [], announcements: [], assignments: [], attendance: [] });
  const [announcement, setAnnouncement] = useState(emptyAnnouncement);
  const [studentSearch, setStudentSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(practicalProjects[0].id);
  const [recipientMode, setRecipientMode] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignmentDueDate, setAssignmentDueDate] = useState("");

  useEffect(() => {
    requestJson("/api/admin/auth")
      .then((result) => {
        setAuthenticated(result.authenticated);
        if (result.authenticated) {
          return loadOverview();
        }
        return null;
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  async function loadOverview() {
    setLoading(true);

    try {
      const result = await requestJson("/api/admin");
      setOverview({
        summary: result.summary || {},
        students: result.students || [],
        announcements: result.announcements || [],
        assignments: result.assignments || [],
        attendance: result.attendance || []
      });
      setStatus({ type: "", message: "" });
    } catch (error) {
      if (error.status === 401) {
        setAuthenticated(false);
      }
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await requestJson("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ email: ADMIN_EMAIL, password })
      });
      setAuthenticated(true);
      setPassword("");
      await loadOverview();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await requestJson("/api/admin/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" })
    }).catch(() => {});
    setAuthenticated(false);
    setOverview({ summary: {}, students: [], announcements: [], assignments: [], attendance: [] });
  }

  async function runAdminAction(action, payload, successMessage) {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestJson("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action, payload })
      });
      setOverview({
        summary: result.summary || {},
        students: result.students || [],
        announcements: result.announcements || [],
        assignments: result.assignments || [],
        attendance: result.attendance || []
      });
      setStatus({ type: "success", message: successMessage });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!announcement.label.trim() || !announcement.title.trim() || !announcement.detail.trim()) {
      setStatus({ type: "error", message: "Complete the announcement label, title, and details." });
      return;
    }

    await runAdminAction("adminSaveAnnouncement", announcement, "Announcement saved.");
    setAnnouncement(emptyAnnouncement);
  }

  async function deleteAnnouncement(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) {
      return;
    }

    await runAdminAction("adminDeleteAnnouncement", { id: item.id }, "Announcement deleted.");
  }

  async function updateStudent(student, operation) {
    let message = "";

    if (operation === "warn") {
      message = window.prompt(`Warning message for ${student.fullName}:`, "Please contact the academy admin and resolve the issue on your account.") || "";
      if (!message.trim()) {
        return;
      }
    }

    if (operation === "delete" && !window.confirm(`Permanently delete ${student.fullName} (${student.studentId}) from the registration database?`)) {
      return;
    }

    await runAdminAction(
      "adminUpdateStudent",
      { studentId: student.studentId, operation, message },
      `${student.fullName} updated successfully.`
    );
  }

  function exportStudents() {
    const headers = ["Student ID", "Full Name", "Status", "Payment", "Email", "Phone", "WhatsApp", "Country", "Session", "Courses", "Fee", "Warning"];
    const rows = overview.students.map((student) => [
      student.studentId,
      student.fullName,
      student.registrationStatus,
      student.paymentStatus,
      student.emailAddress,
      student.phoneNumber,
      student.whatsappNumber,
      student.country,
      student.preferredSession,
      student.learningInterests,
      student.courseFee,
      student.adminWarning
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `eff-academy-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function broadcastAssignment(event) {
    event.preventDefault();
    const project = practicalProjects.find((item) => item.id === selectedProjectId);

    if (!project) {
      setStatus({ type: "error", message: "Select a practical project." });
      return;
    }

    if (recipientMode === "selected" && selectedStudentIds.length === 0) {
      setStatus({ type: "error", message: "Select at least one student recipient." });
      return;
    }

    await runAdminAction(
      "adminBroadcastAssignment",
      {
        ...project,
        dueDate: assignmentDueDate,
        broadcastToAll: recipientMode === "all",
        studentIds: recipientMode === "selected" ? selectedStudentIds : []
      },
      `${project.title} was assigned successfully.`
    );
    setSelectedStudentIds([]);
  }

  async function completeAssignment(item) {
    await runAdminAction(
      "adminUpdateAssignment",
      {
        assignmentId: item.assignmentId,
        studentId: item.studentId,
        status: "completed",
        submission: item.submission,
        note: item.note
      },
      `${item.title} was marked completed for ${item.studentId}.`
    );
  }

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return overview.students;
    }

    return overview.students.filter((student) => (
      [student.studentId, student.fullName, student.emailAddress, student.whatsappNumber, student.registrationStatus]
        .some((value) => String(value || "").toLowerCase().includes(query))
    ));
  }, [overview.students, studentSearch]);
  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return practicalProjects;
    return practicalProjects.filter((project) => (
      [project.moduleTitle, project.title, project.summary, project.tools.join(" ")]
        .some((value) => value.toLowerCase().includes(query))
    ));
  }, [projectSearch]);
  const selectedProject = practicalProjects.find((project) => project.id === selectedProjectId) || practicalProjects[0];

  if (!authReady) {
    return <div className="admin-loading">Checking admin access...</div>;
  }

  if (!authenticated) {
    return (
      <section className="admin-login-shell">
        <form className="admin-login-card" onSubmit={signIn}>
          <div>
            <p className="eyebrow">Restricted Administration</p>
            <h1>Academy control room.</h1>
            <p>Only the approved academy administrator can access student records and management controls.</p>
          </div>
          <label>
            <span>Admin email</span>
            <input type="email" value={ADMIN_EMAIL} readOnly autoComplete="username" />
          </label>
          <label>
            <span>Admin password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
          {status.message && <div className={`form-status is-visible ${status.type}`} role="status">{status.message}</div>}
        </form>
      </section>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">EFF Academy Admin</p>
          <h1>Academy control room</h1>
          <p>Manage announcements, student access, warnings, payments, and registration database records.</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="button ghost-button" type="button" onClick={loadOverview} disabled={loading}>Refresh Data</button>
          <button className="button ghost-button" type="button" onClick={exportStudents} disabled={!overview.students.length}>Export CSV</button>
          <button className="button secondary" type="button" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      {status.message && <div className={`form-status is-visible ${status.type}`} role="status">{status.message}</div>}

      <section className="admin-metrics" aria-label="Academy database summary">
        <article><span>Total Students</span><strong>{overview.summary.totalStudents || 0}</strong></article>
        <article><span>Active</span><strong>{overview.summary.activeStudents || 0}</strong></article>
        <article><span>Suspended</span><strong>{overview.summary.suspendedStudents || 0}</strong></article>
        <article><span>Paid</span><strong>{overview.summary.paidStudents || 0}</strong></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span>Announcement Board</span><h2>Publish and manage updates</h2></div>
        </div>
        <div className="admin-announcement-layout">
          <form className="admin-announcement-form" onSubmit={saveAnnouncement}>
            <label><span>Label</span><input value={announcement.label} onChange={(event) => setAnnouncement((current) => ({ ...current, label: event.target.value }))} placeholder="Class Update" required /></label>
            <label><span>Headline</span><input value={announcement.title} onChange={(event) => setAnnouncement((current) => ({ ...current, title: event.target.value }))} placeholder="Friday class starts at 4 PM" required /></label>
            <label><span>Details</span><textarea value={announcement.detail} onChange={(event) => setAnnouncement((current) => ({ ...current, detail: event.target.value }))} rows="4" required /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={announcement.active} onChange={(event) => setAnnouncement((current) => ({ ...current, active: event.target.checked }))} /> Show on the website and student dashboard</label>
            <div className="admin-form-actions">
              <button className="button primary" type="submit" disabled={loading}>{announcement.id ? "Update Announcement" : "Publish Announcement"}</button>
              {announcement.id && <button className="button ghost-button" type="button" onClick={() => setAnnouncement(emptyAnnouncement)}>Cancel Edit</button>}
            </div>
          </form>
          <div className="admin-announcement-list">
            {overview.announcements.length === 0 ? <p>No managed announcements yet.</p> : overview.announcements.map((item) => (
              <article key={item.id}>
                <span>{item.label} · {item.active ? "Live" : "Hidden"}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <div>
                  <button className="mini-link" type="button" onClick={() => setAnnouncement(item)}>Edit</button>
                  <button className="mini-link danger-link" type="button" onClick={() => deleteAnnouncement(item)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="assignment-studio">
        <div className="admin-panel-heading admin-student-heading">
          <div><span>Private Project Studio</span><h2>Choose and broadcast practical work</h2></div>
          <input type="search" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search modules, projects, or free tools..." />
        </div>
        <p className="assignment-studio-note">These projects remain private in the admin area until you assign one. Broadcasting creates a separate tracked assignment for every selected student and sends an email notice when an address is available.</p>

        <div className="project-library" aria-label="Practical project library">
          {filteredProjects.map((project) => (
            <article key={project.id} className={project.id === selectedProjectId ? "is-selected" : ""}>
              <div className="project-library-heading">
                <span>{project.moduleId.replace("module-", "Module ")} · {project.difficulty}</span>
                <strong>{project.estimatedMinutes} min</strong>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <div className="project-tool-list">{project.tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
              <button className="button ghost-button" type="button" onClick={() => setSelectedProjectId(project.id)}>{project.id === selectedProjectId ? "Selected" : "Use This Project"}</button>
            </article>
          ))}
        </div>

        <div className="assignment-broadcast-layout">
          <article className="project-brief-preview">
            <span>{selectedProject.moduleTitle}</span>
            <h3>{selectedProject.title}</h3>
            <p>{selectedProject.summary}</p>
            <div className="project-brief-block"><strong>Practical prompt</strong><p>{selectedProject.prompt}</p></div>
            <div className="project-brief-block"><strong>Required deliverable</strong><p>{selectedProject.deliverable}</p></div>
            <div className="project-brief-block"><strong>Student steps</strong><ol>{selectedProject.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          </article>

          <form className="assignment-broadcast-form" onSubmit={broadcastAssignment}>
            <div><span>Broadcast Controls</span><h3>Send this assignment</h3></div>
            <fieldset>
              <legend>Recipients</legend>
              <label><input type="radio" name="recipientMode" checked={recipientMode === "all"} onChange={() => setRecipientMode("all")} /> All registered students</label>
              <label><input type="radio" name="recipientMode" checked={recipientMode === "selected"} onChange={() => setRecipientMode("selected")} /> Selected students only</label>
            </fieldset>
            {recipientMode === "selected" && (
              <label><span>Select students</span><select multiple value={selectedStudentIds} onChange={(event) => setSelectedStudentIds(Array.from(event.target.selectedOptions, (option) => option.value))}>{overview.students.map((student) => <option key={student.studentId} value={student.studentId}>{student.fullName} · {student.studentId}</option>)}</select><small>Hold Command or Ctrl to select more than one.</small></label>
            )}
            <label><span>Due date</span><input type="date" value={assignmentDueDate} onChange={(event) => setAssignmentDueDate(event.target.value)} /></label>
            <button className="button primary" type="submit" disabled={loading || overview.students.length === 0}>{loading ? "Sending..." : `Broadcast to ${recipientMode === "all" ? `${overview.students.length} Students` : `${selectedStudentIds.length} Selected`}`}</button>
          </form>
        </div>

        <div className="assignment-operations-grid">
          <div>
            <div className="admin-panel-heading"><div><span>Assignment Records</span><h3>Recent broadcasts and submissions</h3></div></div>
            <div className="assignment-record-list">
              {overview.assignments.length === 0 ? <p>No assignments have been broadcast yet.</p> : overview.assignments.slice(0, 12).map((item) => {
                const submissionUrl = safeSubmissionUrl(item.submission);
                return (
                  <article key={item.assignmentId}>
                    <div><strong>{item.title}</strong><span>{item.studentId} · {item.status}</span></div>
                    <small>{item.dueDate ? `Due ${item.dueDate}` : "No due date"}</small>
                    {submissionUrl ? <a href={submissionUrl} target="_blank" rel="noreferrer">Open submission</a> : item.submission ? <p>{item.submission}</p> : null}
                    {item.status === "submitted" && <button className="mini-link" type="button" onClick={() => completeAssignment(item)}>Mark Completed</button>}
                  </article>
                );
              })}
            </div>
          </div>
          <div>
            <div className="admin-panel-heading"><div><span>Attendance</span><h3>Recent class check-ins</h3></div></div>
            <div className="attendance-record-list">
              {overview.attendance.length === 0 ? <p>No attendance check-ins yet.</p> : overview.attendance.slice(0, 12).map((item) => (
                <article key={item.attendanceId}><strong>{item.studentId}</strong><span>{item.sessionLabel}</span><small>{item.checkedInAt}</small></article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading admin-student-heading">
          <div><span>Registration Database</span><h2>Students and account controls</h2></div>
          <input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search ID, name, email, WhatsApp..." />
        </div>
        <div className="admin-student-table-wrap">
          <table className="admin-student-table">
            <thead><tr><th>Student</th><th>Status</th><th>Payment</th><th>Session</th><th>Contact</th><th>Admin actions</th></tr></thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.studentId}>
                  <td><strong>{student.fullName}</strong><span>{student.studentId}</span><small>{student.country || "Country not provided"}</small></td>
                  <td><strong>{student.registrationStatus || "Pending"}</strong>{student.adminWarning && <small className="student-warning">{student.adminWarning}</small>}</td>
                  <td>{student.paymentStatus || "Not confirmed"}<small>{student.courseFee ? `₦${Number(student.courseFee).toLocaleString("en-NG")}` : ""}</small></td>
                  <td>{student.preferredSession || "Not selected"}</td>
                  <td><a href={`mailto:${student.emailAddress}`}>{student.emailAddress || "No email"}</a><a href={`https://wa.me/${String(student.whatsappNumber || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{student.whatsappNumber || "No WhatsApp"}</a></td>
                  <td><div className="admin-student-actions">
                    <button type="button" onClick={() => updateStudent(student, "approve")}>Approve</button>
                    <button type="button" onClick={() => updateStudent(student, "markPaid")}>Mark Paid</button>
                    {student.paymentScreenshotUrl && <a href={student.paymentScreenshotUrl} target="_blank" rel="noreferrer">Proof</a>}
                    <button type="button" onClick={() => updateStudent(student, "warn")}>Warn</button>
                    {String(student.registrationStatus).toLowerCase() === "suspended" ? (
                      <button type="button" onClick={() => updateStudent(student, "restore")}>Restore</button>
                    ) : (
                      <button type="button" onClick={() => updateStudent(student, "suspend")}>Suspend</button>
                    )}
                    <button className="danger-action" type="button" onClick={() => updateStudent(student, "delete")}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
