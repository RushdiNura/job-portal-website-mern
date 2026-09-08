// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { FiMail, FiBriefcase } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";

// export default function ForgotPassword() {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [sent, setSent] = useState(false);

//   const submit = async (e) => {
//     e.preventDefault();
//     if (!email) {
//       toast.error("Please enter your email");
//       return;
//     }
//     setLoading(true);
//     try {
//       await api.post("/auth/forgot-password", { email });
//       setSent(true);
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
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h1>
//           <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1.5">We'll email you a link to reset it</p>
//         </div>

//         <div className="card p-6 sm:p-8">
//           {sent ? (
//             <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
//               If an account exists for <strong>{email}</strong>, we've sent a password reset link to it.
//             </p>
//           ) : (
//             <form onSubmit={submit} className="space-y-4">
//               <div>
//                 <label className="label">Email</label>
//                 <div className="relative">
//                   <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
//                   <input type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
//                 </div>
//               </div>
//               <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
//                 {loading ? "Sending..." : "Send reset link"}
//               </button>
//             </form>
//           )}
//           <p className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-6">
//             <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Back to login</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMail, FiBriefcase } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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
            Reset your password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1.5">
            We'll email you a link to reset it
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
              If an account exists for <strong>{email}</strong>, we've sent a
              password reset link to it.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-6">
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
