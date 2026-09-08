// import React, { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FiSearch, FiUserPlus, FiSend, FiCheckCircle, FiTrendingUp, FiUsers, FiBriefcase } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";
// import JobCard from "../components/JobCard.jsx";
// import { JobCardSkeleton } from "../components/Skeleton.jsx";
// import toast from "react-hot-toast";

// const steps = [
//   { icon: FiUserPlus, title: "Create your profile", desc: "Sign up as a job seeker or employer in under a minute." },
//   { icon: FiSearch, title: "Search & match", desc: "Browse roles with real filters, or post a job to reach candidates." },
//   { icon: FiSend, title: "Apply or hire", desc: "Submit applications with one click, or review applicants in one dashboard." },
//   { icon: FiCheckCircle, title: "Track progress", desc: "Follow every application from submitted to offer, in real time." },
// ];

// const stats = [
//   { icon: FiBriefcase, label: "Open roles", value: "1,200+" },
//   { icon: FiUsers, label: "Companies hiring", value: "300+" },
//   { icon: FiTrendingUp, label: "Applications sent", value: "40k+" },
// ];

// export default function Landing() {
//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [keyword, setKeyword] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchFeatured = async () => {
//       try {
//         const { data } = await api.get("/jobs?limit=6&sort=newest");
//         setJobs(data.jobs);
//       } catch (err) {
//         toast.error(getErrorMessage(err));
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchFeatured();
//   }, []);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     navigate(`/jobs${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`);
//   };

//   return (
//     <div className="bg-white dark:bg-slate-900 min-h-screen">
//       {/* Hero */}
//       <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-primary-950 dark:via-slate-900 dark:to-slate-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-semibold mb-6">
//             Now hiring across 40+ industries
//           </span>
//           <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
//             Find work that <span className="text-primary-600 dark:text-primary-400">fits your next chapter</span>
//           </h1>
//           <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
//             JobNest connects job seekers with employers who are actually hiring. Search roles, apply in one click, and track every application in one place.
//           </p>

//           <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto">
//             <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
//               <div className="flex-1 relative">
//                 <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
//                 <input
//                   className="w-full pl-10 pr-3 py-3 rounded-lg text-sm outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
//                   placeholder="Job title, keyword, or company"
//                   value={keyword}
//                   onChange={(e) => setKeyword(e.target.value)}
//                 />
//               </div>
//               <button type="submit" className="btn-primary py-3 sm:w-auto">Search jobs</button>
//             </div>
//           </form>

//           <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
//             <span>Hiring? </span>
//             <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
//               Post a job for free →
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           {stats.map((s) => (
//             <div key={s.label} className="card p-5 flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
//               <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
//                 <s.icon size={20} />
//               </div>
//               <div>
//                 <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
//                 <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Featured jobs */}
//       <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
//         <div className="flex items-end justify-between mb-8">
//           <div>
//             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Featured jobs</h2>
//             <p className="text-slate-500 dark:text-slate-400 mt-1">Fresh roles from companies hiring right now</p>
//           </div>
//           <Link to="/jobs" className="hidden sm:inline text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
//             View all jobs →
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//           {loading
//             ? Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
//             : jobs.map((job) => <JobCard key={job._id} job={job} showSaveButton={false} />)}
//         </div>

//         {!loading && jobs.length === 0 && (
//           <p className="text-center text-slate-500 dark:text-slate-400 py-10">No jobs posted yet — be the first to add one.</p>
//         )}
//       </section>

//       {/* How it works */}
//       <section className="bg-slate-50 dark:bg-slate-900 py-20 border-t border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-14">
//             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">How JobNest works</h2>
//             <p className="text-slate-500 dark:text-slate-400 mt-2">From sign-up to offer, in four steps</p>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {steps.map((s, i) => (
//               <div key={s.title} className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
//                 <div className="w-11 h-11 rounded-lg bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center mb-4">
//                   <s.icon size={20} />
//                 </div>
//                 <h3 className="text-slate-900 dark:text-white font-semibold mb-1.5">{s.title}</h3>
//                 <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
//         <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Ready to get started?</h2>
//         <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">Join thousands of job seekers and employers already using JobNest.</p>
//         <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
//           <Link to="/register" className="btn-primary px-6 py-3">Create free account</Link>
//           <Link to="/jobs" className="btn-secondary px-6 py-3">Browse jobs</Link>
//         </div>
//       </section>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUserPlus,
  FiSend,
  FiCheckCircle,
  FiTrendingUp,
  FiUsers,
  FiBriefcase,
  FiArrowRight,
} from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import JobCard from "../components/JobCard.jsx";
import { JobCardSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";

const steps = [
  {
    icon: FiUserPlus,
    title: "Create your profile",
    desc: "Sign up as a job seeker or employer in under a minute.",
  },
  {
    icon: FiSearch,
    title: "Search & match",
    desc: "Browse roles with real filters, or post a job to reach candidates.",
  },
  {
    icon: FiSend,
    title: "Apply or hire",
    desc: "Submit applications with one click, or review applicants in one dashboard.",
  },
  {
    icon: FiCheckCircle,
    title: "Track progress",
    desc: "Follow every application from submitted to offer, in real time.",
  },
];

const stats = [
  { icon: FiBriefcase, label: "Open roles", value: "1,200+" },
  { icon: FiUsers, label: "Companies hiring", value: "300+" },
  { icon: FiTrendingUp, label: "Applications sent", value: "40k+" },
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
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(
      `/jobs${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`,
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-semibold mb-6 border border-primary-200 dark:border-primary-800">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            Now hiring across 40+ industries
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Find work that{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
              fits your next chapter
            </span>
          </h1>

          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            JobNest connects job seekers with employers who are actually hiring.
            Search roles, apply in one click, and track every application in one
            place.
          </p>

          <form onSubmit={handleSearch} className="mt-10 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
              <div className="flex-1 relative">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                  size={18}
                />
                <input
                  className="w-full pl-10 pr-3 py-3 rounded-lg text-sm outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all"
                  placeholder="Job title, keyword, or company"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary py-3 px-6 sm:w-auto font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Search jobs
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Hiring? </span>
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors group inline-flex items-center gap-1"
            >
              Post a job for free
              <FiArrowRight
                className="group-hover:translate-x-1 transition-transform"
                size={14}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="card p-5 flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {s.value}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Featured jobs
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Fresh roles from companies hiring right now
            </p>
          </div>
          <Link
            to="/jobs"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors group"
          >
            View all jobs
            <FiArrowRight
              className="group-hover:translate-x-1 transition-transform"
              size={14}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))
            : jobs.map((job) => (
                <JobCard key={job._id} job={job} showSaveButton={false} />
              ))}
        </div>

        {!loading && jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              No jobs posted yet — be the first to add one.
            </p>
          </div>
        )}

        {/* Mobile view all link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View all jobs
            <FiArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 dark:bg-slate-800/50 py-20 border-t border-slate-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              How JobNest works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              From sign-up to offer, in four steps
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-slate-300 dark:bg-slate-600"></div>
                )}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-500 dark:to-primary-600 text-white flex items-center justify-center mb-4 shadow-md">
                  <s.icon size={20} />
                </div>
                <h3 className="text-slate-900 dark:text-white font-semibold mb-1.5">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 sm:p-12 border border-primary-200 dark:border-slate-700">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Ready to get started?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-md mx-auto">
            Join thousands of job seekers and employers already using JobNest.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="btn-primary px-6 py-3 font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Create free account
            </Link>
            <Link
              to="/jobs"
              className="btn-secondary px-6 py-3 font-semibold hover:shadow-lg transition-all duration-200"
            >
              Browse jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}