import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBriefcase, FiBookmark, FiFileText, FiUser, FiCalendar, FiZap, FiMessageSquare, FiX } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import JobCard from "../components/JobCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { TextSkeleton, JobCardSkeleton } from "../components/Skeleton.jsx";

const TABS = [
  { key: "applied", label: "Applied Jobs", icon: FiFileText },
  { key: "saved", label: "Saved Jobs", icon: FiBookmark },
  { key: "interviews", label: "Interviews", icon: FiCalendar },
  { key: "recommended", label: "Recommended", icon: FiZap },
];

export default function SeekerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("applied");
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [appsRes, savedRes, interviewsRes] = await Promise.all([
          api.get("/applications/mine"),
          api.get("/jobs/saved/mine"),
          api.get("/interviews/mine"),
        ]);
        setApplications(appsRes.data.applications);
        setSavedJobs(savedRes.data.jobs);
        setInterviews(interviewsRes.data.interviews);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const { data } = await api.get("/recommendations");
        setRecommendations(data.recommendations);
      } catch {
        // Recommendations are a nice-to-have; fail silently and just show an empty state
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecs();
  }, []);

  const unsaveJob = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/save`);
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success("Removed from saved jobs");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const withdrawApplication = async (applicationId) => {
    try {
      await api.put(`/applications/${applicationId}/withdraw`);
      setApplications((prev) => prev.map((a) => (a._id === applicationId ? { ...a, status: "Withdrawn" } : a)));
      toast.success("Application withdrawn");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const messageEmployer = async (applicationId) => {
    try {
      const { data } = await api.post("/conversations/start", { applicationId });
      navigate(`/messages/${data.conversation._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmInterview = async (interviewId, status) => {
    try {
      await api.put(`/interviews/${interviewId}`, { status });
      setInterviews((prev) => prev.map((iv) => (iv._id === interviewId ? { ...iv, status } : iv)));
      toast.success(`Interview ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const stats = [
    { label: "Applications", value: applications.length, icon: FiFileText },
    { label: "Saved jobs", value: savedJobs.length, icon: FiBookmark },
    { label: "Interviews", value: interviews.length, icon: FiCalendar },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your job search progress</p>
        </div>
        <Link to="/profile" className="btn-secondary">
          <FiUser size={16} /> Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <TextSkeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : tab === "applied" ? (
        applications.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No applications yet"
            description="Start applying to jobs and track their progress here."
            action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>}
          />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Link to={`/jobs/${app.job?._id}`} className="font-semibold text-slate-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-400">
                    {app.job?.title || "Job no longer available"}
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{app.job?.company?.name} · {app.job?.location}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  {!["Hired", "Rejected", "Withdrawn"].includes(app.status) && (
                    <>
                      <button onClick={() => messageEmployer(app._id)} className="btn-secondary" title="Message employer">
                        <FiMessageSquare size={14} />
                      </button>
                      <button onClick={() => withdrawApplication(app._id)} className="btn-danger" title="Withdraw application">
                        <FiX size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "saved" ? (
        savedJobs.length === 0 ? (
          <EmptyState
            icon={FiBookmark}
            title="No saved jobs"
            description="Save jobs you're interested in to review them later."
            action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedJobs.map((job) => (
              <JobCard key={job._id} job={job} saved onToggleSave={unsaveJob} />
            ))}
          </div>
        )
      ) : tab === "interviews" ? (
        interviews.length === 0 ? (
          <EmptyState icon={FiCalendar} title="No interviews scheduled" description="Interviews scheduled by employers will show up here." />
        ) : (
          <div className="space-y-3">
            {interviews.map((iv) => (
              <div key={iv._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{iv.job?.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMinutes} min · {iv.type}
                  </p>
                  {iv.meetingUrl && (
                    <a href={iv.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1 inline-block">
                      Join video call →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={iv.status} />
                  {iv.status === "Scheduled" && (
                    <>
                      <button onClick={() => confirmInterview(iv._id, "Confirmed")} className="btn-secondary text-xs">Confirm</button>
                      <button onClick={() => confirmInterview(iv._id, "Cancelled")} className="btn-danger text-xs">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : loadingRecs ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={FiZap}
          title="No recommendations yet"
          description="Add skills and a headline to your profile so we can match you with relevant jobs."
          action={<Link to="/profile" className="btn-primary">Update profile</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendations.map((r) => (
            <div key={r.job._id} className="flex flex-col gap-2">
              <JobCard job={r.job} showSaveButton={false} />
              <div className="px-1 -mt-2">
                {r.reasons.slice(0, 2).map((reason, i) => (
                  <p key={i} className="text-xs text-primary-600 dark:text-primary-400 flex items-start gap-1">
                    <FiZap size={12} className="mt-0.5 shrink-0" /> {reason}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
