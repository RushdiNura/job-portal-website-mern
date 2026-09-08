import React from "react";

export function JobCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          <Shimmer />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden"><Shimmer /></div>
          <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden"><Shimmer /></div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden"><Shimmer /></div>
        <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden"><Shimmer /></div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-6 w-14 bg-slate-100 dark:bg-slate-800 rounded-md relative overflow-hidden"><Shimmer /></div>
        <div className="h-6 w-14 bg-slate-100 dark:bg-slate-800 rounded-md relative overflow-hidden"><Shimmer /></div>
      </div>
    </div>
  );
}

function Shimmer() {
  return (
    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
  );
}

export function TextSkeleton({ className = "h-4 w-full" }) {
  return <div className={`bg-slate-100 dark:bg-slate-800 rounded relative overflow-hidden ${className}`}><Shimmer /></div>;
}
