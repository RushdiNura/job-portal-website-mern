// import React, { useEffect, useState, useCallback } from "react";
// import toast from "react-hot-toast";
// import {
//   FiSearch, FiDatabase, FiBookmark, FiMail, FiPhone, FiMapPin, FiClock, FiX, FiTag,
// } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";
// import EmptyState from "../components/EmptyState.jsx";
// import { TextSkeleton } from "../components/Skeleton.jsx";
// import Modal from "../components/Modal.jsx";
// import Pagination from "../components/Pagination.jsx";

// const EXPERIENCE_LEVELS = ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"];
// const STAGES = ["Prospect", "Contacted", "Interested", "Not a Fit"];

// export default function TalentDatabase() {
//   const [tab, setTab] = useState("search");
//   const [keyword, setKeyword] = useState("");
//   const [experienceLevel, setExperienceLevel] = useState("");
//   const [location, setLocation] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [pool, setPool] = useState([]);
//   const [loadingPool, setLoadingPool] = useState(true);

//   const [editTarget, setEditTarget] = useState(null);
//   const [editForm, setEditForm] = useState({ tags: "", notes: "", stage: "Prospect" });
//   const [saving, setSaving] = useState(false);
//   const [removeTarget, setRemoveTarget] = useState(null);

//   const search = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (keyword) params.set("keyword", keyword);
//       if (experienceLevel) params.set("experienceLevel", experienceLevel);
//       if (location) params.set("location", location);
//       params.set("page", page);
//       params.set("limit", 9);
//       const { data } = await api.get(`/talent?${params.toString()}`);
//       setCandidates(data.candidates);
//       setTotalPages(data.totalPages);
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   }, [keyword, experienceLevel, location, page]);

//   const loadPool = async () => {
//     setLoadingPool(true);
//     try {
//       const { data } = await api.get("/talent/pool/mine");
//       setPool(data.entries);
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setLoadingPool(false);
//     }
//   };

//   useEffect(() => { search(); }, [search]);
//   useEffect(() => { loadPool(); }, []);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setPage(1);
//     search();
//   };

//   const openSaveModal = (candidate, existingEntry) => {
//     setEditTarget(candidate);
//     setEditForm({
//       tags: (existingEntry?.tags || []).join(", "),
//       notes: existingEntry?.notes || "",
//       stage: existingEntry?.stage || "Prospect",
//     });
//   };

//   const submitSave = async () => {
//     setSaving(true);
//     try {
//       await api.post(`/talent/pool/${editTarget._id}`, {
//         tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
//         notes: editForm.notes,
//         stage: editForm.stage,
//       });
//       toast.success("Saved to talent pool");
//       setEditTarget(null);
//       setCandidates((prev) => prev.map((c) => (c._id === editTarget._id ? { ...c, savedToPool: true } : c)));
//       loadPool();
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const removeFromPool = (entry) => {
//     setRemoveTarget(entry);
//   };

//   const confirmRemoveFromPool = async () => {
//     const candidateId = removeTarget.candidate._id;
//     setRemoveTarget(null);
//     try {
//       await api.delete(`/talent/pool/${candidateId}`);
//       setPool((prev) => prev.filter((e) => e.candidate._id !== candidateId));
//       setCandidates((prev) => prev.map((c) => (c._id === candidateId ? { ...c, savedToPool: false } : c)));
//       toast.success("Removed from talent pool");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     }
//   };

//   const CandidateCard = ({ candidate, entry }) => (
//     <div className="card p-5 flex flex-col gap-3">
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <p className="font-semibold text-slate-900 dark:text-white">{candidate.name}</p>
//           {candidate.headline && <p className="text-sm text-slate-500 dark:text-slate-400">{candidate.headline}</p>}
//         </div>
//         <button
//           onClick={() => openSaveModal(candidate, entry)}
//           className={candidate.savedToPool || entry ? "btn-primary" : "btn-secondary"}
//           title="Save to talent pool"
//         >
//           <FiBookmark size={14} />
//         </button>
//       </div>

//       <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
//         {candidate.location && <span className="inline-flex items-center gap-1"><FiMapPin size={12} /> {candidate.location}</span>}
//         {candidate.experienceLevel && <span className="inline-flex items-center gap-1"><FiClock size={12} /> {candidate.experienceLevel}</span>}
//         {candidate.availability && <span>{candidate.availability}</span>}
//       </div>

//       {candidate.skills?.length > 0 && (
//         <div className="flex flex-wrap gap-1.5">
//           {candidate.skills.slice(0, 6).map((s) => (
//             <span key={s} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">{s}</span>
//           ))}
//         </div>
//       )}

//       {entry?.tags?.length > 0 && (
//         <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
//           {entry.tags.map((t) => (
//             <span key={t} className="px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 text-xs font-medium inline-flex items-center gap-1">
//               <FiTag size={10} /> {t}
//             </span>
//           ))}
//         </div>
//       )}

//       {(candidate.email || entry) && (
//         <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
//           {candidate.email && <span className="inline-flex items-center gap-1"><FiMail size={12} /> {candidate.email}</span>}
//           {candidate.phone && <span className="inline-flex items-center gap-1"><FiPhone size={12} /> {candidate.phone}</span>}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
//       <div className="flex items-center gap-2 mb-2">
//         <FiDatabase className="text-primary-600" size={22} />
//         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Talent Database</h1>
//       </div>
//       <p className="text-slate-500 dark:text-slate-400 mb-8">Search candidates who've opted in to be discoverable, and build your own private talent pool.</p>

//       <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6">
//         {[{ key: "search", label: "Search Talent" }, { key: "pool", label: `My Talent Pool (${pool.length})` }].map((t) => (
//           <button
//             key={t.key}
//             onClick={() => setTab(t.key)}
//             className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//               tab === t.key ? "border-primary-600 text-primary-700 dark:text-primary-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
//             }`}
//           >
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {tab === "search" ? (
//         <>
//           <form onSubmit={handleSubmit} className="card p-4 sm:p-5 mb-6">
//             <div className="flex flex-col sm:flex-row gap-3">
//               <div className="flex-1 relative">
//                 <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                 <input className="input pl-10" placeholder="Name, headline, or skill" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
//               </div>
//               <input className="input sm:w-48" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
//               <select className="input sm:w-48" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
//                 <option value="">Any experience</option>
//                 {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
//               </select>
//               <button type="submit" className="btn-primary sm:w-auto">Search</button>
//             </div>
//           </form>

//           {loading ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//               {Array.from({ length: 6 }).map((_, i) => <TextSkeleton key={i} className="h-40 w-full rounded-xl" />)}
//             </div>
//           ) : candidates.length === 0 ? (
//             <EmptyState
//               icon={FiDatabase}
//               title="No candidates found"
//               description="Try broadening your filters. Only candidates who've opted into the talent database appear here."
//             />
//           ) : (
//             <>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//                 {candidates.map((c) => <CandidateCard key={c._id} candidate={c} />)}
//               </div>
//               <Pagination page={page} totalPages={totalPages} onChange={setPage} />
//             </>
//           )}
//         </>
//       ) : loadingPool ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//           {Array.from({ length: 3 }).map((_, i) => <TextSkeleton key={i} className="h-40 w-full rounded-xl" />)}
//         </div>
//       ) : pool.length === 0 ? (
//         <EmptyState
//           icon={FiBookmark}
//           title="Your talent pool is empty"
//           description="Save promising candidates from the search tab to build your own private roster, independent of any specific job."
//         />
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//           {pool.map((entry) => (
//             <div key={entry._id} className="relative">
//               <CandidateCard candidate={entry.candidate} entry={entry} />
//               <button
//                 onClick={() => removeFromPool(entry)}
//                 className="absolute top-4 right-14 text-slate-400 hover:text-red-500"
//                 title="Remove from pool"
//                 aria-label="Remove from pool"
//               >
//                 <FiX size={16} />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       <Modal
//         open={!!editTarget}
//         onClose={() => setEditTarget(null)}
//         title={`Save ${editTarget?.name || ""} to your talent pool`}
//         footer={
//           <>
//             <button className="btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
//             <button className="btn-primary" onClick={submitSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
//           </>
//         }
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="label">Stage</label>
//             <select className="input" value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}>
//               {STAGES.map((s) => <option key={s}>{s}</option>)}
//             </select>
//           </div>
//           <div>
//             <label className="label">Tags (comma separated)</label>
//             <input className="input" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="Senior, Referral, React" />
//           </div>
//           <div>
//             <label className="label">Private notes</label>
//             <textarea className="input min-h-[100px]" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes only you can see..." />
//           </div>
//         </div>
//       </Modal>

//       <Modal
//         open={!!removeTarget}
//         onClose={() => setRemoveTarget(null)}
//         title="Remove from talent pool?"
//         footer={
//           <>
//             <button className="btn-secondary" onClick={() => setRemoveTarget(null)}>Cancel</button>
//             <button className="btn-danger" onClick={confirmRemoveFromPool}>Remove</button>
//           </>
//         }
//       >
//         <p className="text-sm text-slate-600 dark:text-slate-300">
//           This removes <strong>{removeTarget?.candidate?.name}</strong> and your private notes/tags about them from your talent pool. They'll still appear in search if you want to save them again later.
//         </p>
//       </Modal>
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiDatabase,
  FiBookmark,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiX,
  FiTag,
} from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import EmptyState from "../components/EmptyState.jsx";
import { TextSkeleton } from "../components/Skeleton.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "1-2 Years",
  "3-5 Years",
  "5+ Years",
  "Senior",
];
const STAGES = ["Prospect", "Contacted", "Interested", "Not a Fit"];

export default function TalentDatabase() {
  const [tab, setTab] = useState("search");
  const [keyword, setKeyword] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pool, setPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);

  const [editTarget, setEditTarget] = useState(null);
  const [editMode, setEditMode] = useState("create"); // "create" | "edit"
  const [editForm, setEditForm] = useState({
    tags: "",
    notes: "",
    stage: "Prospect",
  });
  const [saving, setSaving] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (experienceLevel) params.set("experienceLevel", experienceLevel);
      if (location) params.set("location", location);
      params.set("page", page);
      params.set("limit", 9);
      const { data } = await api.get(`/talent?${params.toString()}`);
      setCandidates(data.candidates);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [keyword, experienceLevel, location, page]);

  const loadPool = async () => {
    setLoadingPool(true);
    try {
      const { data } = await api.get("/talent/pool/mine");
      setPool(data.entries);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    search();
  }, [search]);
  useEffect(() => {
    loadPool();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    search();
  };

  const openSaveModal = (candidate, existingEntry) => {
    const isEdit = !!existingEntry || !!candidate.savedToPool;
    setEditTarget(candidate);
    setEditMode(isEdit ? "edit" : "create");
    setEditForm({
      tags: (existingEntry?.tags || []).join(", "),
      notes: existingEntry?.notes || "",
      stage: existingEntry?.stage || "Prospect",
    });
  };

  const submitSave = async () => {
    setSaving(true);
    try {
      await api.post(`/talent/pool/${editTarget._id}`, {
        tags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: editForm.notes,
        stage: editForm.stage,
      });
      toast.success(
        editMode === "edit"
          ? "Talent pool entry updated"
          : "Saved to talent pool",
      );
      setEditTarget(null);
      setCandidates((prev) =>
        prev.map((c) =>
          c._id === editTarget._id ? { ...c, savedToPool: true } : c,
        ),
      );
      loadPool();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeFromPool = async (candidateId) => {
    try {
      await api.delete(`/talent/pool/${candidateId}`);
      setPool((prev) => prev.filter((e) => e.candidate._id !== candidateId));
      setCandidates((prev) =>
        prev.map((c) =>
          c._id === candidateId ? { ...c, savedToPool: false } : c,
        ),
      );
      toast.success("Removed from talent pool");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const CandidateCard = ({ candidate, entry }) => {
    const isSaved = !!candidate.savedToPool || !!entry;

    return (
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {candidate.name}
            </p>
            {candidate.headline && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {candidate.headline}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => openSaveModal(candidate, entry)}
              className={isSaved ? "btn-primary" : "btn-secondary"}
              title={isSaved ? "Edit in talent pool" : "Save to talent pool"}
            >
              <FiBookmark size={14} />
            </button>
            {isSaved && (
              <button
                onClick={() => removeFromPool(candidate._id)}
                className="btn-secondary text-red-500 hover:text-red-600"
                title="Remove from talent pool"
                aria-label="Remove from talent pool"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          {candidate.location && (
            <span className="inline-flex items-center gap-1">
              <FiMapPin size={12} /> {candidate.location}
            </span>
          )}
          {candidate.experienceLevel && (
            <span className="inline-flex items-center gap-1">
              <FiClock size={12} /> {candidate.experienceLevel}
            </span>
          )}
          {candidate.availability && <span>{candidate.availability}</span>}
        </div>

        {candidate.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.slice(0, 6).map((s) => (
              <span
                key={s}
                className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {entry?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 text-xs font-medium inline-flex items-center gap-1"
              >
                <FiTag size={10} /> {t}
              </span>
            ))}
          </div>
        )}

        {(candidate.email || entry) && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
            {candidate.email && (
              <span className="inline-flex items-center gap-1">
                <FiMail size={12} /> {candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="inline-flex items-center gap-1">
                <FiPhone size={12} /> {candidate.phone}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-2">
        <FiDatabase className="text-primary-600" size={22} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Talent Database
        </h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Search candidates who've opted in to be discoverable, and build your own
        private talent pool.
      </p>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { key: "search", label: "Search Talent" },
          { key: "pool", label: `My Talent Pool (${pool.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary-600 text-primary-700 dark:text-primary-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "search" ? (
        <>
          <form onSubmit={handleSubmit} className="card p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="input pl-10"
                  placeholder="Name, headline, or skill"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <input
                className="input sm:w-48"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <select
                className="input sm:w-48"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="">Any experience</option>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary sm:w-auto">
                Search
              </button>
            </div>
          </form>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <TextSkeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={FiDatabase}
              title="No candidates found"
              description="Try broadening your filters. Only candidates who've opted into the talent database appear here."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {candidates.map((c) => (
                  <CandidateCard key={c._id} candidate={c} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </>
      ) : loadingPool ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <TextSkeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : pool.length === 0 ? (
        <EmptyState
          icon={FiBookmark}
          title="Your talent pool is empty"
          description="Save promising candidates from the search tab to build your own private roster, independent of any specific job."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pool.map((entry) => (
            <CandidateCard
              key={entry._id}
              candidate={entry.candidate}
              entry={entry}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={
          editMode === "edit"
            ? `Edit ${editTarget?.name || ""} in your talent pool`
            : `Save ${editTarget?.name || ""} to your talent pool`
        }
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={submitSave}
              disabled={saving}
            >
              {saving ? "Saving..." : editMode === "edit" ? "Update" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Stage</label>
            <select
              className="input"
              value={editForm.stage}
              onChange={(e) =>
                setEditForm({ ...editForm, stage: e.target.value })
              }
            >
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input
              className="input"
              value={editForm.tags}
              onChange={(e) =>
                setEditForm({ ...editForm, tags: e.target.value })
              }
              placeholder="Senior, Referral, React"
            />
          </div>
          <div>
            <label className="label">Private notes</label>
            <textarea
              className="input min-h-[100px]"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
              placeholder="Notes only you can see..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}