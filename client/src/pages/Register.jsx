import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiBriefcase, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, getErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (!form.role) errs.role = "Select a role to continue";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to JobNest, ${user.name.split(" ")[0]}!`);
      navigate(
        user.role === "employer" ? "/employer/dashboard" : "/seeker/dashboard",
        { replace: true },
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center mx-auto mb-4">
            <FiBriefcase size={20} />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1.5">
            Join JobNest as a job seeker or employer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-4">
          <div>
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "seeker" })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  form.role === "seeker"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <FiSearch className="text-primary-600 mb-2" size={18} />
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Job Seeker
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Looking for work
                </p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "employer" })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  form.role === "employer"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <FiBriefcase className="text-primary-600 mb-2" size={18} />
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  Employer
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Hiring talent
                </p>
              </button>
            </div>
            {errors.role && (
              <p className="text-xs text-red-600 mt-1.5">{errors.role}</p>
            )}
          </div>

          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <FiUser
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={16}
              />
              <input
                className="input pl-10"
                placeholder="Jordan Lee"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {form.role === "employer" && (
            <div className="animate-fadeIn">
              <label className="label">Company name</label>
              <input
                className="input"
                placeholder="Acme Inc."
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <FiMail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={16}
              />
              <input
                type="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <FiLock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={16}
              />
              <input
                type="password"
                className="input pl-10"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
