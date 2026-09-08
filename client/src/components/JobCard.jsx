import React from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiClock, FiDollarSign, FiBookmark } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const formatSalary = (min, max, currency = "USD") => {
  if (!min && !max) return null;
  const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n);
  const symbol = currency === "USD" ? "$" : currency;
  if (min && max) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
  return `${symbol}${fmt(min || max)}`;
};

export default function JobCard({ job, saved, onToggleSave, showSaveButton = true }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <div className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
            {job.company?.name?.slice(0, 2).toUpperCase() || "CO"}
          </div>
          <div className="min-w-0">
            <Link to={`/jobs/${job._id}`} className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              {job.title}
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{job.company?.name || "Company"}</p>
          </div>
        </div>
        {showSaveButton && (
          <button
            onClick={() => onToggleSave?.(job._id)}
            aria-label={saved ? "Unsave job" : "Save job"}
            className={`shrink-0 p-2 rounded-lg transition-colors ${
              saved ? "text-primary-600 bg-primary-50" : "text-slate-300 dark:text-slate-600 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <FiBookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <FiMapPin size={13} /> {job.location} {job.remote && "· Remote"}
        </span>
        <span className="inline-flex items-center gap-1">
          <FiClock size={13} /> {job.type}
        </span>
        {salary && (
          <span className="inline-flex items-center gap-1">
            <FiDollarSign size={13} /> {salary}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(job.skills || []).slice(0, 3).map((s) => (
          <span key={s} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">{s}</span>
        ))}
        {job.experience && (
          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">{job.experience}</span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {job.createdAt ? `Posted ${formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}` : ""}
        </span>
        <Link to={`/jobs/${job._id}`} className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          View job →
        </Link>
      </div>
    </div>
  );
}
