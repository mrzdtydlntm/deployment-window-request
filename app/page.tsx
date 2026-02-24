"use client";

import { useState, useEffect, FormEvent } from "react";

type Deployment = {
  id: number;
  title: string;
  time: string;
  teamIssuer: string;
  issuerName: string;
  crq: string | null;
  rlm: string | null;
  mopLink: string | null;
};

export default function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/deployments");
      if (res.ok) {
        const data = await res.json();
        setDeployments(data);
      }
    } catch (err) {
      console.error("Failed to fetch deployments", err);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysArray = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const prevMonthDays = daysInMonth(year, month - 1);
    const daysArray = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      daysArray.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }
    for (let i = 1; i <= days; i++) {
      daysArray.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingCells = 42 - daysArray.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      daysArray.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    return daysArray;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const [formData, setFormData] = useState({
    title: "",
    time: "",
    teamIssuer: "",
    issuerName: "",
    crq: "",
    rlm: "",
    mopLink: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.time.trim()) errors.time = "Time is required";
    if (!formData.teamIssuer.trim()) errors.teamIssuer = "Team Issuer is required";
    if (!formData.issuerName.trim()) errors.issuerName = "Issuer Name is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("time", formData.time);
    data.append("teamIssuer", formData.teamIssuer);
    data.append("issuerName", formData.issuerName);
    if (formData.crq) data.append("crq", formData.crq);
    if (formData.rlm) data.append("rlm", formData.rlm);
    if (formData.mopLink) data.append("mopLink", formData.mopLink);

    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: "", time: "", teamIssuer: "", issuerName: "", crq: "", rlm: "", mopLink: "" });
        setFormErrors({});
        fetchDeployments();
      } else {
        const err = await res.json();
        alert("Failed: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeploymentsForDate = (date: Date) => {
    return deployments.filter((d) => {
      const dDate = new Date(d.time);
      return (
        dDate.getDate() === date.getDate() &&
        dDate.getMonth() === date.getMonth() &&
        dDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <main>
      <div className="calendar-container glass-panel" style={{ padding: "2rem" }}>
        <header className="calendar-header">
          <h1>Deployment Window Request</h1>
          <button className="btn" onClick={() => setIsModalOpen(true)}>
            + Request Deployment
          </button>
        </header>

        <div className="cal-nav" style={{ marginBottom: "1.5rem", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={handlePrevMonth}>
            &larr; Prev
          </button>
          <h2>{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</h2>
          <button className="btn btn-secondary" onClick={handleNextMonth}>
            Next &rarr;
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div className="loader"></div> <span style={{ marginLeft: "10px" }}>Loading deployments...</span>
          </div>
        ) : (
          <>
            <div className="calendar-grid" style={{ marginBottom: "1rem" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {getDaysArray().map((cell, idx) => {
                const cellDeployments = getDeploymentsForDate(cell.date);
                return (
                  <div
                    key={idx}
                    className={`calendar-cell ${!cell.isCurrentMonth ? "muted" : ""} ${isToday(cell.date) ? "today" : ""}`}
                    onClick={() => {
                      // Pre-fill form date when clicking an empty cell if needed
                    }}
                  >
                    <div className="date-number">{cell.day}</div>

                    {cellDeployments.map((dep) => (
                      <div
                        key={dep.id}
                        className="deployment-badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeployment(dep);
                        }}
                        title={`${dep.title} (${new Date(dep.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
                      >
                        {new Date(dep.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {dep.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            <h3>Request Deployment</h3>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label>
                  Title <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={formErrors.title ? { borderColor: "var(--danger)" } : {}}
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                />
                {formErrors.title && (
                  <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                    {formErrors.title}
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Time <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    style={formErrors.time ? { borderColor: "var(--danger)" } : {}}
                    required
                    value={formData.time}
                    onChange={(e) => {
                      setFormData({ ...formData, time: e.target.value });
                      if (formErrors.time) setFormErrors({ ...formErrors, time: "" });
                    }}
                  />
                  {formErrors.time && (
                    <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                      {formErrors.time}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>
                    Team Issuer <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={formErrors.teamIssuer ? { borderColor: "var(--danger)" } : {}}
                    required
                    value={formData.teamIssuer}
                    onChange={(e) => {
                      setFormData({ ...formData, teamIssuer: e.target.value });
                      if (formErrors.teamIssuer) setFormErrors({ ...formErrors, teamIssuer: "" });
                    }}
                  />
                  {formErrors.teamIssuer && (
                    <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                      {formErrors.teamIssuer}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>
                  Issuer Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={formErrors.issuerName ? { borderColor: "var(--danger)" } : {}}
                  required
                  value={formData.issuerName}
                  onChange={(e) => {
                    setFormData({ ...formData, issuerName: e.target.value });
                    if (formErrors.issuerName) setFormErrors({ ...formErrors, issuerName: "" });
                  }}
                />
                {formErrors.issuerName && (
                  <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                    {formErrors.issuerName}
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CRQ (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.crq}
                    onChange={(e) => setFormData({ ...formData, crq: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>RLM (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.rlm}
                    onChange={(e) => setFormData({ ...formData, rlm: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>MoP Link (URL)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://..."
                  value={formData.mopLink}
                  onChange={(e) => setFormData({ ...formData, mopLink: e.target.value })}
                />
              </div>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="loader" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDeployment && (
        <div className="modal-overlay" onClick={() => setSelectedDeployment(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedDeployment(null)}>
              &times;
            </button>
            <h3 style={{ marginBottom: "0.5rem" }}>{selectedDeployment.title}</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              {new Date(selectedDeployment.time).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}
            </p>

            <div className="deployment-details">
              <dl>
                <dt>Team Issuer</dt>
                <dd>{selectedDeployment.teamIssuer}</dd>

                <dt>Issuer Name</dt>
                <dd>{selectedDeployment.issuerName}</dd>

                <dt>CRQ ID</dt>
                <dd>{selectedDeployment.crq || "-"}</dd>

                <dt>RLM ID</dt>
                <dd>{selectedDeployment.rlm || "-"}</dd>
              </dl>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>Attached Documents</h4>
              <div className="file-links">
                {selectedDeployment.mopLink ? (
                  <a
                    href={selectedDeployment.mopLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: "none" }}
                  >
                    🔗 View MoP Document
                  </a>
                ) : (
                  <span style={{ color: "var(--danger)", fontSize: "0.9rem", display: "flex", alignItems: "center" }}>
                    No MoP Link attached
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
