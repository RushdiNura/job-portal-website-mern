// import React from "react";
// import { Link } from "react-router-dom";

// export default function NotFound() {
//   return (
//     <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
//       <p className="text-6xl font-extrabold text-primary-600">404</p>
//       <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Page not found</h1>
//       <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 max-w-sm">The page you're looking for doesn't exist or may have been moved.</p>
//       <Link to="/" className="btn-primary mt-6">Back to home</Link>
//     </div>
//   );
// }


import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-extrabold text-primary-600">404</p>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
        Page not found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-2 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
