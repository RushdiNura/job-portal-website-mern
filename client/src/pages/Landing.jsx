import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch, FiUserPlus, FiSend, FiCheckCircle, FiZap, FiDatabase, FiUsers, FiBriefcase,
} from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import JobCard from "../components/JobCard.jsx";
import { JobCardSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";

const steps = [
  { icon: FiUserPlus, title: "Create your profile", desc: "Sign up as a job seeker or employer in under a minute." },
  { icon: FiSearch, title: "Search & discover", desc: "Browse open roles, or search the talent database for candidates who fit." },
  { icon: FiZap, title: "AI screens automatically", desc: "Every application is scored against the job the moment it lands - no manual triage." },
  { icon: FiCheckCircle, title: "Manage the pipeline", desc: "Move candidates through your hiring stages, schedule interviews, and message directly." },
];

const pillars = [
  {
    icon: FiZap,
    title: "AI Screening",
    desc: "Every applicant is automatically scored against the job's required skills and experience the moment they apply - with a skill-by-skill breakdown, not a black box.",
    linkTo: "/register",
    linkLabel: "See it on your dashboard",
  },
  {
    icon: FiDatabase,
    title: "Talent Database",
    desc: "Search a real pool of candidates who've opted in to be discovered, and build your own private, tagged shortlist independent of any single job posting.",
    linkTo: "/register",
    linkLabel: "Explore the talent pool",
  },
  {
    icon: FiUsers,
    title: "Recruitment & HR Services",
    desc: "A drag-and-drop hiring pipeline, interview scheduling with conflict detection, and built-in messaging - the operational core of a recruitment team, not just a job board.",
    linkTo: "/register",
    linkLabel: "Run your hiring pipeline",
  },
];

export default function Landing() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/jobs?limit=6&sort=newest");
        setJobs(data.jobs);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-400 text-xs font-semibold mb-6">
            <FiZap size={12} /> AI-powered screening, built in
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            The recruitment platform that <span className="text-primary-600">screens, sources, and hires</span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            JobNest is a full recruitment and HR platform: AI screening scores every applicant automatically, a searchable talent database helps you source proactively, and a real hiring pipeline keeps your team organized end to end.
          </p>

          <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-100 dark:border-slate-800">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  className="w-full pl-10 pr-3 py-3 rounded-lg text-sm outline-none"
                  placeholder="Job title, keyword, or company"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary py-3 sm:w-auto">Search jobs</button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Hiring or recruiting? </span>
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Set up your employer account →</Link>
          </div>
        </div>
      </section>

      {/* Three pillars: AI Screening, Talent Database, Recruitment/HR Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <div key={p.title} className="card p-6">
              <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
                <p.icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{p.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              <Link to={p.linkTo} className="inline-block mt-4 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700">
                {p.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Featured jobs</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Fresh roles from companies hiring right now</p>
          </div>
          <Link to="/jobs" className="hidden sm:inline text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            View all jobs →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
            : jobs.map((job) => <JobCard key={job._id} job={job} showSaveButton={false} />)}
        </div>

        {!loading && jobs.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-10">No jobs posted yet — be the first to add one.</p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How JobNest works for hiring teams</h2>
            <p className="text-slate-400 mt-2">From sourcing to hire, without switching tools</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.title} className="relative">
                <div className="w-11 h-11 rounded-lg bg-primary-600 text-white flex items-center justify-center mb-4">
                  <s.icon size={20} />
                </div>
                <h3 className="text-white font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Ready to run your hiring on JobNest?</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">Post a job, screen candidates automatically, and search the talent database - all from one dashboard.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary px-6 py-3">Create free account</Link>
          <Link to="/jobs" className="btn-secondary px-6 py-3">Browse jobs</Link>
        </div>
      </section>
    </div>
  );
}
