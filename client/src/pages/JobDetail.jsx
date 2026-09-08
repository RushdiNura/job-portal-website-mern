import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiBriefcase,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { TextSkeleton } from "../components/Skeleton.jsx";
import Modal from "../components/Modal.jsx";
import FileUpload from "../components/FileUpload.jsx";
import MapView from "../components/MapView.jsx";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/jobs/${id}`);
        setJob(data.job);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    const checkApplied = async () => {
      if (user?.role !== "seeker") return;
      try {
        const { data } = await api.get("/applications/mine");
        setAlreadyApplied(data.applications.some((a) => a.job?._id === id));
      } catch {
        // ignore
      }
    };
    checkApplied();
  }, [user, id]);

  const handleApplyClick = () => {
    if (!user) {
      toast.error("Please log in as a job seeker to apply");
      navigate("/login");
      return;
    }
    if (user.role !== "seeker") {
      toast.error("Only job seeker accounts can apply for jobs");
      return;
    }
    setApplyOpen(true);
  };

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("coverLetter", coverLetter);
      if (resumeFile) formData.append("resume", resumeFile);

      await api.post(`/applications/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Application submitted!");
      setApplyOpen(false);
      setAlreadyApplied(true);
      setCoverLetter("");
      setResumeFile(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = () => {
    if (!job?.salaryMin && !job?.salaryMax) return null;
    const symbol = job.currency === "USD" ? "$" : job.currency;
    if (job.salaryMin && job.salaryMax)
      return `${symbol}${job.salaryMin.toLocaleString()} - ${symbol}${job.salaryMax.toLocaleString()}`;
    return `${symbol}${(job.salaryMin || job.salaryMax).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <TextSkeleton className="h-8 w-1/2" />
        <TextSkeleton className="h-4 w-1/3" />
        <TextSkeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500">
          Job not found.
        </p>
        <Link
          to="/jobs"
          className="text-primary-600 font-semibold mt-4 inline-block"
        >
          ← Back to job listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft size={15} /> Back to jobs
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
              {job.company?.name?.slice(0, 2).toUpperCase() || "CO"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {job.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">
                {job.company?.name}
              </p>
            </div>
          </div>

          {user?.role !== "employer" &&
            (alreadyApplied ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold">
                <FiCheckCircle size={16} /> Applied
              </span>
            ) : (
              <button onClick={handleApplyClick} className="btn-primary px-6">
                Apply now
              </button>
            ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-6">
          <span className="inline-flex items-center gap-1.5">
            <FiMapPin size={15} /> {job.location} {job.remote && "· Remote"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiClock size={15} /> {job.type}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiBriefcase size={15} /> {job.experience}
          </span>
          {formatSalary() && (
            <span className="inline-flex items-center gap-1.5">
              <FiDollarSign size={15} /> {formatSalary()}
            </span>
          )}
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
            About this role
          </h2>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        {job.responsibilities?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
              Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              {job.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {job.requirements?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
              Requirements
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
              {job.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
            Location
          </h2>
          <MapView
            latitude={job.latitude}
            longitude={job.longitude}
            label={`${job.title} · ${job.location}`}
          />
        </div>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply for ${job.title}`}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setApplyOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={submitApplication}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Resume</label>
            <FileUpload
              file={resumeFile}
              onChange={setResumeFile}
              existingFileName={user?.resumeFileName}
            />
            {!resumeFile && user?.resumeFileName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1.5">
                Leave blank to apply with the resume already on your profile.
              </p>
            )}
          </div>
          <div>
            <label className="label">Cover letter (optional)</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Tell the employer why you're a great fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
