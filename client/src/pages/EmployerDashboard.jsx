import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPlus, FiUsers, FiBriefcase, FiEye, FiEdit2, FiTrash2, FiDownload,
  FiMessageSquare, FiCalendar, FiBarChart2, FiTrendingUp,
} from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { TextSkeleton } from "../components/Skeleton.jsx";

const emptyJobForm = {
  title: "", description: "", location: "", latitude: "", longitude: "", remote: false, type: "Full-Time",
  experience: "Entry Level", salaryMin: "", salaryMax: "", category: "",
  skills: "", responsibilities: "", requirements: "",
};

const STATUS_OPTIONS = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Offer", "Hired", "Rejected"];

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", durationMinutes: 30, type: "Video", notes: "" });
  const [scheduling, setScheduling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes, interviewsRes, analyticsRes] = await Promise.all([
        api.get("/jobs/employer/mine"),
        api.get("/applications/employer/all"),
        api.get("/interviews/mine"),
        api.get("/analytics/employer"),
      ]);
      setJobs(jobsRes.data.jobs);
      setApplicants(appsRes.data.applications);
      setInterviews(interviewsRes.data.interviews);
      setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewJobModal = () => {
    setEditingJob(null);
    setJobForm(emptyJobForm);
    setJobModalOpen(true);
  };

  const openEditJobModal = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      location: job.location,
      latitude: job.latitude ?? "",
      longitude: job.longitude ?? "",
      remote: job.remote,
      type: job.type,
      experience: job.experience,
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      category: job.category || "",
      skills: (job.skills || []).join(", "),
      responsibilities: (job.responsibilities || []).join("\n"),
      requirements: (job.requirements || []).join("\n"),
    });
    setJobModalOpen(true);
  };

  const saveJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.location) {
      toast.error("Title, description, and location are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...jobForm,
        latitude: jobForm.latitude === "" ? null : Number(jobForm.latitude),
        longitude: jobForm.longitude === "" ? null : Number(jobForm.longitude),
        salaryMin: Number(jobForm.salaryMin) || 0,
        salaryMax: Number(jobForm.salaryMax) || 0,
        skills: jobForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        responsibilities: jobForm.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
        requirements: jobForm.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
      };

      if (editingJob) {
        await api.put(`/jobs/${editingJob._id}`, payload);
        toast.success("Job updated");
      } else {
        await api.post("/jobs", payload);
        toast.success("Job posted");
      }
      setJobModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/jobs/${deleteTarget._id}`);
      toast.success("Job deleted");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setApplicants((prev) => prev.map((a) => (a._id === applicationId ? { ...a, status } : a)));
      toast.success("Status updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const downloadResume = async (applicationId, fileName) => {
    try {
      const res = await api.get(`/applications/${applicationId}/resume`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "resume");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const messageApplicant = async (applicationId) => {
    try {
      const { data } = await api.post("/conversations/start", { applicationId });
      navigate(`/messages/${data.conversation._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const submitSchedule = async () => {
    if (!scheduleForm.scheduledAt) {
      toast.error("Pick a date and time");
      return;
    }
    setScheduling(true);
    try {
      await api.post("/interviews", {
        applicationId: scheduleTarget._id,
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: Number(scheduleForm.durationMinutes) || 30,
        type: scheduleForm.type,
        notes: scheduleForm.notes,
      });
      toast.success("Interview scheduled");
      setScheduleTarget(null);
      setScheduleForm({ scheduledAt: "", durationMinutes: 30, type: "Video", notes: "" });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setScheduling(false);
    }
  };

  const stats = analytics
    ? [
        { label: "Active jobs", value: analytics.activeJobs, icon: FiBriefcase },
        { label: "Total applicants", value: analytics.totalApplications, icon: FiUsers },
        { label: "Interviews", value: analytics.interviews, icon: FiCalendar },
        { label: "Hires", value: analytics.hires, icon: FiTrendingUp },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employer Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your job postings and applicants</p>
        </div>
        <button onClick={openNewJobModal} className="btn-primary">
          <FiPlus size={16} /> Post a job
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto">
        {[
          { key: "jobs", label: "Job Postings" },
          { key: "applicants", label: "Applicants" },
          { key: "interviews", label: "Interviews" },
          { key: "analytics", label: "Analytics" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <TextSkeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : tab === "jobs" ? (
        jobs.length === 0 ? (
          <EmptyState icon={FiBriefcase} title="No jobs posted yet" description="Post your first job to start receiving applicants." action={<button onClick={openNewJobModal} className="btn-primary">Post a job</button>} />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{job.title}</p>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{job.location} · {job.type}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{job.applicantsCount} applicant{job.applicantsCount !== 1 ? "s" : ""} · {job.views} view{job.views !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditJobModal(job)} className="btn-secondary" aria-label="Edit job"><FiEdit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(job)} className="btn-danger" aria-label="Delete job"><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "applicants" ? (
        applicants.length === 0 ? (
          <EmptyState icon={FiUsers} title="No applicants yet" description="Applicants will show up here once candidates apply to your jobs." />
        ) : (
          <div className="space-y-3">
            {applicants.map((app) => (
              <div key={app._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{app.applicant?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Applied for {app.job?.title}</p>
                  {app.applicant?.headline && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{app.applicant.headline}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => messageApplicant(app._id)} className="btn-secondary" title="Message applicant">
                    <FiMessageSquare size={14} />
                  </button>
                  <button onClick={() => setScheduleTarget(app)} className="btn-secondary" title="Schedule interview">
                    <FiCalendar size={14} />
                  </button>
                  <button onClick={() => downloadResume(app._id, app.applicant?.name + "-resume")} className="btn-secondary">
                    <FiDownload size={14} /> Resume
                  </button>
                  <select
                    className="input py-2 text-sm w-auto"
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "interviews" ? (
        interviews.length === 0 ? (
          <EmptyState icon={FiCalendar} title="No interviews scheduled" description="Schedule an interview from the Applicants tab." />
        ) : (
          <div className="space-y-3">
            {interviews.map((iv) => (
              <div key={iv._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{iv.candidate?.name} · {iv.job?.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMinutes} min · {iv.type}
                  </p>
                  {iv.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{iv.notes}</p>}
                </div>
                <StatusBadge status={iv.status} />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FiBarChart2 size={16} /> Application pipeline
            </h3>
            {analytics && Object.keys(analytics.statusBreakdown || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                  const max = Math.max(...Object.values(analytics.statusBreakdown), 1);
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300 w-40 truncate">{status}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No applications yet.</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Conversion rate (applications ÷ job views): <strong className="text-slate-600 dark:text-slate-300">{analytics?.conversionRate ?? 0}%</strong>
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Applications per job</h3>
            {analytics?.applicationsPerJob?.length ? (
              <div className="space-y-2">
                {analytics.applicationsPerJob.map((j) => {
                  const max = Math.max(...analytics.applicationsPerJob.map((x) => x.applicants), 1);
                  return (
                    <div key={j.jobId} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300 w-40 truncate">{j.title}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(j.applicants / max) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-16 text-right">{j.applicants} / {j.views}v</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No jobs posted yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Job create/edit modal */}
      <Modal
        open={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title={editingJob ? "Edit job posting" : "Post a new job"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setJobModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveJob} disabled={saving}>
              {saving ? "Saving..." : editingJob ? "Save changes" : "Post job"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Job title</label>
            <input className="input" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Frontend Developer" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px]" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Describe the role..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Location</label>
              <input className="input" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="Remote / City" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="rounded border-slate-300 text-primary-600" checked={jobForm.remote} onChange={(e) => setJobForm({ ...jobForm, remote: e.target.checked })} />
                Remote position
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude (optional, for map)</label>
              <input className="input" value={jobForm.latitude} onChange={(e) => setJobForm({ ...jobForm, latitude: e.target.value })} placeholder="37.7749" />
            </div>
            <div>
              <label className="label">Longitude (optional, for map)</label>
              <input className="input" value={jobForm.longitude} onChange={(e) => setJobForm({ ...jobForm, longitude: e.target.value })} placeholder="-122.4194" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Job type</label>
              <select className="input" value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}>
                {["Full-Time", "Part-Time", "Internship", "Contract"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience</label>
              <select className="input" value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}>
                {["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Min salary</label>
              <input type="number" className="input" value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} placeholder="60000" />
            </div>
            <div>
              <label className="label">Max salary</label>
              <input type="number" className="input" value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} placeholder="90000" />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" value={jobForm.category} onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })} placeholder="Engineering" />
          </div>
          <div>
            <label className="label">Skills (comma separated)</label>
            <input className="input" value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="React, Node.js, MongoDB" />
          </div>
          <div>
            <label className="label">Responsibilities (one per line)</label>
            <textarea className="input min-h-[80px]" value={jobForm.responsibilities} onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })} />
          </div>
          <div>
            <label className="label">Requirements (one per line)</label>
            <textarea className="input min-h-[80px]" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete job posting"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={confirmDelete}><FiTrash2 size={14} /> Delete job</button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will also remove all associated applications and cannot be undone.
        </p>
      </Modal>

      {/* Schedule interview modal */}
      <Modal
        open={!!scheduleTarget}
        onClose={() => setScheduleTarget(null)}
        title={`Schedule interview with ${scheduleTarget?.applicant?.name || ""}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setScheduleTarget(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitSchedule} disabled={scheduling}>
              {scheduling ? "Scheduling..." : "Schedule interview"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Date & time</label>
            <input type="datetime-local" className="input" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input" value={scheduleForm.durationMinutes} onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })} />
            </div>
            <div>
              <label className="label">Interview type</label>
              <select className="input" value={scheduleForm.type} onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}>
                <option>Video</option>
                <option>Phone</option>
                <option>In-Person</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input min-h-[80px]" value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} placeholder="Interview agenda, who's joining, etc." />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Conflicts with your existing schedule or the candidate's are checked automatically on the server.
          </p>
        </div>
      </Modal>
    </div>
  );
}
