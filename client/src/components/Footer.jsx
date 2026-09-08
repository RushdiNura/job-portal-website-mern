import React from "react";
import { Link } from "react-router-dom";
import { FiBriefcase } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <FiBriefcase size={16} />
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white">JobNest</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Connecting talented people with teams that need them.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">For Job Seekers</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/jobs" className="hover:text-primary-600">Browse jobs</Link></li>
            <li><Link to="/register" className="hover:text-primary-600">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">For Employers</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/register" className="hover:text-primary-600">Post a job</Link></li>
            <li><Link to="/login" className="hover:text-primary-600">Employer login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="hover:text-primary-600">About</a></li>
            <li><a href="#" className="hover:text-primary-600">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} JobNest. All rights reserved.
      </div>
    </footer>
  );
}
