import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiBriefcase, FiBell, FiUser, FiLogOut, FiMessageSquare, FiSun, FiMoon, FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
    isActive
      ? "text-primary-700 bg-primary-50 dark:text-primary-400 dark:bg-primary-950"
      : "text-slate-600 hover:text-primary-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-800"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === "employer" ? "/employer/dashboard" : user?.role === "admin" ? "/admin/dashboard" : "/seeker/dashboard";

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center">
            <FiBriefcase size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">JobNest</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/jobs" className={navLinkClass}>Find Jobs</NavLink>
          {user && <NavLink to={dashboardPath} className={navLinkClass}>Dashboard</NavLink>}
          {user && user.role !== "admin" && <NavLink to="/messages" className={navLinkClass}>Messages</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin/dashboard" className={navLinkClass}>Admin</NavLink>}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 transition"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          {user ? (
            <>
              {user.role !== "admin" && (
                <Link to="/messages" className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 transition" aria-label="Messages">
                  <FiMessageSquare size={18} />
                </Link>
              )}
              <Link to="/profile" className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 transition" aria-label="Profile">
                <FiUser size={18} />
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                <FiLogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
          >
            {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-1 bg-white dark:bg-slate-950 animate-fadeIn">
          <NavLink to="/" end className={navLinkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/jobs" className={navLinkClass} onClick={() => setOpen(false)}>Find Jobs</NavLink>
          {user && <NavLink to={dashboardPath} className={navLinkClass} onClick={() => setOpen(false)}>Dashboard</NavLink>}
          {user && user.role !== "admin" && (
            <NavLink to="/messages" className={navLinkClass} onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-1.5"><FiMessageSquare size={15} /> Messages</span>
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-1.5"><FiShield size={15} /> Admin</span>
            </NavLink>
          )}
          {user && <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>Profile</NavLink>}
          <div className="pt-2 flex flex-col gap-2">
            {user ? (
              <button onClick={handleLogout} className="btn-secondary w-full">
                <FiLogOut size={16} /> Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary w-full" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
