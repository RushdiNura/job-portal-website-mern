import React, { useState } from "react";
import { FiSearch, FiMapPin, FiSliders } from "react-icons/fi";

const TYPES = ["Full-Time", "Part-Time", "Internship", "Contract"];
const EXPERIENCE = ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"];

export default function SearchBar({ filters, onSearch }) {
  const [local, setLocal] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  const update = (k, v) => setLocal((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    onSearch(local);
  };

  const clearFilters = () => {
    const cleared = { keyword: "", location: "", type: "", experience: "", remote: false, sort: "newest" };
    setLocal(cleared);
    onSearch(cleared);
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Job title, keyword, or skill"
            value={local.keyword || ""}
            onChange={(e) => update("keyword", e.target.value)}
          />
        </div>
        <div className="flex-1 relative">
          <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Location"
            value={local.location || ""}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
        <button type="button" onClick={() => setShowFilters((s) => !s)} className="btn-secondary sm:w-auto">
          <FiSliders size={16} /> Filters
        </button>
        <button type="submit" className="btn-primary sm:w-auto">Search</button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fadeIn">
          <select className="input" value={local.type || ""} onChange={(e) => update("type", e.target.value)}>
            <option value="">Any job type</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input" value={local.experience || ""} onChange={(e) => update("experience", e.target.value)}>
            <option value="">Any experience</option>
            {EXPERIENCE.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input" value={local.sort || "newest"} onChange={(e) => update("sort", e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="salary_high">Salary: high to low</option>
            <option value="salary_low">Salary: low to high</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 px-1">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={!!local.remote}
              onChange={(e) => update("remote", e.target.checked)}
            />
            Remote only
          </label>
          <button type="button" onClick={clearFilters} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 sm:col-span-4 text-left">
            Clear all filters
          </button>
        </div>
      )}
    </form>
  );
}
