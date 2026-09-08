// import React, { useState } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { FiLock, FiBriefcase } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";

// export default function ResetPassword() {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const submit = async (e) => {
//     e.preventDefault();
//     if (password.length < 6) {
//       toast.error("Password must be at least 6 characters");
//       return;
//     }
//     setLoading(true);
//     try {
//       await api.post(`/auth/reset-password/${token}`, { password });
//       toast.success("Password reset successfully. Please log in.");
//       navigate("/login");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <span className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center mx-auto mb-4">
//             <FiBriefcase size={20} />
//           </span>
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Set a new password</h1>
//         </div>
//         <form onSubmit={submit} className="card p-6 sm:p-8 space-y-4">
//           <div>
//             <label className="label">New password</label>
//             <div className="relative">
//               <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
//               <input type="password" className="input pl-10" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
//             </div>
//           </div>
//           <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
//             {loading ? "Resetting..." : "Reset password"}
//           </button>
//           <p className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
//             <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Back to login</Link>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiLock, FiBriefcase } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successfully. Please log in.");
      navigate("/login");
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
            Set a new password
          </h1>
        </div>
        <form onSubmit={submit} className="card p-6 sm:p-8 space-y-4">
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <FiLock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={16}
              />
              <input
                type="password"
                className="input pl-10"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
