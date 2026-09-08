import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiUsers, FiBriefcase, FiFileText, FiCheckCircle, FiSearch, FiShield } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { TextSkeleton } from "../components/Skeleton.jsx";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalytics(data.analytics);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const loadUsers = async (q = "") => {
    try {
      const { data } = await api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setUsers(data.users);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const loadJobs = async () => {
    try {
      const { data } = await api.get("/admin/jobs");
      setJobs(data.jobs);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadOverview(), loadUsers(), loadJobs()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !isActive });
      toast.success(!isActive ? "User activated" : "User deactivated");
      loadUsers(query);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleJobStatus = async (jobId, status) => {
    try {
      await api.put(`/admin/jobs/${jobId}/status`, { status: status === "open" ? "closed" : "open" });
      toast.success("Job status updated");
      loadJobs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const stats = analytics
    ? [
        { label: "Candidates", value: analytics.candidates, icon: FiUsers },
        { label: "Employers", value: analytics.employers, icon: FiBriefcase },
        { label: "Total jobs", value: analytics.jobs, icon: FiFileText },
        { label: "Open jobs", value: analytics.openJobs, icon: FiCheckCircle },
        { label: "Applications", value: analytics.applications, icon: FiFileText },
        { label: "Hires", value: analytics.hires, icon: FiCheckCircle },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-8">
        <FiShield className="text-primary-600" size={24} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { key: "overview", label: "Overview" },
          { key: "users", label: "Users" },
          { key: "jobs", label: "Jobs" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <TextSkeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : tab === "overview" ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="card p-4">
                <s.icon className="text-primary-600 mb-2" size={18} />
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Popular categories</h3>
            {analytics?.popularCategories?.length ? (
              <div className="space-y-2">
                {analytics.popularCategories.map((c) => {
                  const max = analytics.popularCategories[0].count || 1;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300 w-32 truncate">{c.category}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No job categories recorded yet.</p>
            )}
          </div>
        </>
      ) : tab === "users" ? (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative max-w-sm">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="input pl-10"
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => { setQuery(e.target.value); loadUsers(e.target.value); }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">{u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.isActive ? "open" : "closed"} /></td>
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => toggleUserStatus(u._id, u.isActive)}
                          className={u.isActive ? "btn-danger" : "btn-secondary"}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">No users found.</p>}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Employer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j._id}>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{j.title}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{j.company?.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{j.employer?.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleJobStatus(j._id, j.status)} className="btn-secondary">
                        {j.status === "open" ? "Close job" : "Reopen job"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <p className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">No jobs found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
