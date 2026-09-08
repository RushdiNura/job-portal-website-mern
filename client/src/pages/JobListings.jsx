// import React, { useEffect, useState, useCallback } from "react";
// import { useSearchParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import { FiSearch } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";
// import { useAuth } from "../context/AuthContext.jsx";
// import JobCard from "../components/JobCard.jsx";
// import { JobCardSkeleton } from "../components/Skeleton.jsx";
// import SearchBar from "../components/SearchBar.jsx";
// import Pagination from "../components/Pagination.jsx";
// import EmptyState from "../components/EmptyState.jsx";

// export default function JobListings() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const { user } = useAuth();

//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalResults, setTotalResults] = useState(0);
//   const [savedIds, setSavedIds] = useState(new Set());

//   const filters = {
//     keyword: searchParams.get("keyword") || "",
//     location: searchParams.get("location") || "",
//     type: searchParams.get("type") || "",
//     experience: searchParams.get("experience") || "",
//     remote: searchParams.get("remote") === "true",
//     sort: searchParams.get("sort") || "newest",
//   };

//   const fetchJobs = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       Object.entries(filters).forEach(([k, v]) => {
//         if (v) params.set(k, v);
//       });
//       params.set("page", page);
//       params.set("limit", 9);

//       const { data } = await api.get(`/jobs?${params.toString()}`);
//       setJobs(data.jobs);
//       setTotalPages(data.totalPages);
//       setTotalResults(data.totalResults);
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchParams, page]);

//   useEffect(() => {
//     fetchJobs();
//   }, [fetchJobs]);

//   useEffect(() => {
//     const loadSaved = async () => {
//       if (user?.role !== "seeker") return;
//       try {
//         const { data } = await api.get("/jobs/saved/mine");
//         setSavedIds(new Set(data.jobs.map((j) => j._id)));
//       } catch {
//         // silent - saved state is a nice-to-have
//       }
//     };
//     loadSaved();
//   }, [user]);

//   const handleSearch = (newFilters) => {
//     const params = new URLSearchParams();
//     Object.entries(newFilters).forEach(([k, v]) => {
//       if (v) params.set(k, v);
//     });
//     setSearchParams(params);
//     setPage(1);
//   };

//   const handleToggleSave = async (jobId) => {
//     if (!user) {
//       toast.error("Log in as a job seeker to save jobs");
//       return;
//     }
//     try {
//       const { data } = await api.post(`/jobs/${jobId}/save`);
//       setSavedIds((prev) => {
//         const next = new Set(prev);
//         data.saved ? next.add(jobId) : next.delete(jobId);
//         return next;
//       });
//       toast.success(data.saved ? "Job saved" : "Removed from saved jobs");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find your next job</h1>
//         <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">{totalResults} open role{totalResults !== 1 ? "s" : ""} matching your search</p>
//       </div>

//       <SearchBar filters={filters} onSearch={handleSearch} />

//       <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//         {loading
//           ? Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)
//           : jobs.map((job) => (
//               <JobCard
//                 key={job._id}
//                 job={job}
//                 saved={savedIds.has(job._id)}
//                 onToggleSave={handleToggleSave}
//                 showSaveButton={user?.role === "seeker"}
//               />
//             ))}
//       </div>

//       {!loading && jobs.length === 0 && (
//         <EmptyState
//           icon={FiSearch}
//           title="No jobs found"
//           description="Try adjusting your filters or searching a different keyword."
//         />
//       )}

//       <Pagination page={page} totalPages={totalPages} onChange={setPage} />
//     </div>
//   );
// }


import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import JobCard from "../components/JobCard.jsx";
import { JobCardSkeleton } from "../components/Skeleton.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Pagination from "../components/Pagination.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function JobListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [savedIds, setSavedIds] = useState(new Set());

  const filters = {
    keyword: searchParams.get("keyword") || "",
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
    experience: searchParams.get("experience") || "",
    remote: searchParams.get("remote") === "true",
    sort: searchParams.get("sort") || "newest",
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set("page", page);
      params.set("limit", 9);

      const { data } = await api.get(`/jobs?${params.toString()}`);
      setJobs(data.jobs);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalResults);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const loadSaved = async () => {
      if (user?.role !== "seeker") return;
      try {
        const { data } = await api.get("/jobs/saved/mine");
        setSavedIds(new Set(data.jobs.map((j) => j._id)));
      } catch {
        // silent - saved state is a nice-to-have
      }
    };
    loadSaved();
  }, [user]);

  const handleSearch = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
    setPage(1);
  };

  const handleToggleSave = async (jobId) => {
    if (!user) {
      toast.error("Log in as a job seeker to save jobs");
      return;
    }
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSavedIds((prev) => {
        const next = new Set(prev);
        data.saved ? next.add(jobId) : next.delete(jobId);
        return next;
      });
      toast.success(data.saved ? "Job saved" : "Removed from saved jobs");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Find your next job
        </h1>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">
          {totalResults} open role{totalResults !== 1 ? "s" : ""} matching your
          search
        </p>
      </div>

      <SearchBar filters={filters} onSearch={handleSearch} />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)
          : jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                saved={savedIds.has(job._id)}
                onToggleSave={handleToggleSave}
                showSaveButton={user?.role === "seeker"}
              />
            ))}
      </div>

      {!loading && jobs.length === 0 && (
        <EmptyState
          icon={FiSearch}
          title="No jobs found"
          description="Try adjusting your filters or searching a different keyword."
        />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
