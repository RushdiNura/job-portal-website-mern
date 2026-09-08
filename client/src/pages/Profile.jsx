// import React, { useState } from "react";
// import toast from "react-hot-toast";
// import { FiSave, FiLock, FiFileText, FiZap, FiBell } from "react-icons/fi";
// import api, { getErrorMessage } from "../services/api.js";
// import { useAuth } from "../context/AuthContext.jsx";
// import FileUpload from "../components/FileUpload.jsx";
// import { enablePushNotifications, disablePushNotifications } from "../services/push.js";

// export default function Profile() {
//   const { user, updateUserLocal } = useAuth();
//   const [form, setForm] = useState({
//     name: user?.name || "",
//     phone: user?.phone || "",
//     location: user?.location || "",
//     headline: user?.headline || "",
//     skills: (user?.skills || []).join(", "),
//   });
//   const [saving, setSaving] = useState(false);
//   const [resumeFile, setResumeFile] = useState(null);
//   const [uploadingResume, setUploadingResume] = useState(false);

//   const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
//   const [changingPw, setChangingPw] = useState(false);

//   const [analysis, setAnalysis] = useState(null);
//   const [analyzing, setAnalyzing] = useState(false);
//   const [analysisError, setAnalysisError] = useState("");

//   const [pushEnabled, setPushEnabled] = useState(false);
//   const [togglingPush, setTogglingPush] = useState(false);

//   const saveProfile = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       const payload = { ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) };
//       const { data } = await api.put("/users/me", payload);
//       updateUserLocal(data.user);
//       toast.success("Profile updated");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const uploadResume = async () => {
//     if (!resumeFile) return;
//     setUploadingResume(true);
//     try {
//       const formData = new FormData();
//       formData.append("resume", resumeFile);
//       const { data } = await api.post("/users/me/resume", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       updateUserLocal({ resumeUrl: data.resumeUrl, resumeFileName: data.resumeFileName });
//       setResumeFile(null);
//       toast.success("Resume uploaded");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setUploadingResume(false);
//     }
//   };

//   const changePassword = async (e) => {
//     e.preventDefault();
//     if (!pwForm.currentPassword || !pwForm.newPassword) {
//       toast.error("Please fill in both password fields");
//       return;
//     }
//     if (pwForm.newPassword.length < 6) {
//       toast.error("New password must be at least 6 characters");
//       return;
//     }
//     setChangingPw(true);
//     try {
//       await api.put("/users/me/password", pwForm);
//       toast.success("Password updated");
//       setPwForm({ currentPassword: "", newPassword: "" });
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setChangingPw(false);
//     }
//   };

//   const runResumeAnalysis = async () => {
//     setAnalyzing(true);
//     setAnalysisError("");
//     setAnalysis(null);
//     try {
//       const { data } = await api.post("/ai/analyze-resume", {});
//       setAnalysis(data.analysis);
//     } catch (err) {
//       setAnalysisError(getErrorMessage(err));
//     } finally {
//       setAnalyzing(false);
//     }
//   };

//   const togglePush = async () => {
//     setTogglingPush(true);
//     try {
//       if (pushEnabled) {
//         await disablePushNotifications();
//         await api.put("/push/preferences", { push: false });
//         setPushEnabled(false);
//         toast.success("Push notifications disabled");
//       } else {
//         const result = await enablePushNotifications();
//         if (result.status === "subscribed") {
//           setPushEnabled(true);
//           toast.success("Push notifications enabled");
//         } else if (result.status === "not_configured") {
//           toast.error("Push notifications aren't configured on this server yet");
//         } else if (result.status === "denied") {
//           toast.error("Notification permission was denied");
//         } else {
//           toast.error("Push notifications aren't supported in this browser");
//         }
//       }
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setTogglingPush(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
//       <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Your profile</h1>
//       <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-8">Manage your personal information and account settings</p>

//       <form onSubmit={saveProfile} className="card p-6 sm:p-8 space-y-4">
//         <h2 className="font-semibold text-slate-900 dark:text-white">Personal information</h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div>
//             <label className="label">Full name</label>
//             <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
//           </div>
//           <div>
//             <label className="label">Email</label>
//             <input className="input bg-slate-50 dark:bg-slate-900" value={user?.email || ""} disabled />
//           </div>
//           <div>
//             <label className="label">Phone</label>
//             <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 123 4567" />
//           </div>
//           <div>
//             <label className="label">Location</label>
//             <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="San Francisco, CA" />
//           </div>
//         </div>

//         {user?.role === "seeker" && (
//           <>
//             <div>
//               <label className="label">Headline</label>
//               <input className="input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Frontend Developer" />
//             </div>
//             <div>
//               <label className="label">Skills (comma separated)</label>
//               <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, JavaScript, CSS" />
//             </div>
//           </>
//         )}

//         <button type="submit" disabled={saving} className="btn-primary">
//           <FiSave size={16} /> {saving ? "Saving..." : "Save changes"}
//         </button>
//       </form>

//       {user?.role === "seeker" && (
//         <div className="card p-6 sm:p-8 mt-6 space-y-4">
//           <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FiFileText size={16} /> Resume</h2>
//           <FileUpload file={resumeFile} onChange={setResumeFile} existingFileName={user?.resumeFileName} />
//           {resumeFile && (
//             <button onClick={uploadResume} disabled={uploadingResume} className="btn-primary">
//               {uploadingResume ? "Uploading..." : "Upload resume"}
//             </button>
//           )}
//         </div>
//       )}

//       {user?.role === "seeker" && (
//         <div className="card p-6 sm:p-8 mt-6 space-y-4">
//           <div className="flex items-center justify-between">
//             <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FiZap size={16} /> AI Resume Analyzer</h2>
//             <button onClick={runResumeAnalysis} disabled={analyzing || !user?.resumeFileName} className="btn-primary">
//               {analyzing ? "Analyzing..." : "Analyze my resume"}
//             </button>
//           </div>

//           {!user?.resumeFileName && (
//             <p className="text-sm text-slate-500 dark:text-slate-400">Upload a resume above first, then run the analysis.</p>
//           )}

//           {analysisError && (
//             <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 p-4 text-sm text-amber-700 dark:text-amber-300">
//               {analysisError}
//             </div>
//           )}

//           {analysis && (
//             <div className="space-y-4 animate-fadeIn">
//               <div className="flex items-center gap-4">
//                 <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900 flex items-center justify-center">
//                   <span className="text-lg font-extrabold text-primary-600 dark:text-primary-400">{analysis.score}</span>
//                 </div>
//                 <p className="text-sm text-slate-600 dark:text-slate-300">{analysis.summary}</p>
//               </div>
//               {analysis.strengths?.length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">Strengths</h3>
//                   <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
//                     {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
//                   </ul>
//                 </div>
//               )}
//               {analysis.suggestions?.length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">Suggestions</h3>
//                   <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
//                     {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
//                   </ul>
//                 </div>
//               )}
//               {analysis.missingKeywords?.length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">Consider adding these keywords</h3>
//                   <div className="flex flex-wrap gap-1.5">
//                     {analysis.missingKeywords.map((k) => (
//                       <span key={k} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">{k}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}

//       <div className="card p-6 sm:p-8 mt-6 space-y-4">
//         <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FiBell size={16} /> Notifications</h2>
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-sm font-medium text-slate-900 dark:text-white">Push notifications</p>
//             <p className="text-xs text-slate-500 dark:text-slate-400">Get notified about messages, application updates, and interviews</p>
//           </div>
//           <button onClick={togglePush} disabled={togglingPush} className={pushEnabled ? "btn-secondary" : "btn-primary"}>
//             {togglingPush ? "..." : pushEnabled ? "Disable" : "Enable"}
//           </button>
//         </div>
//       </div>

//       <form onSubmit={changePassword} className="card p-6 sm:p-8 mt-6 space-y-4">
//         <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FiLock size={16} /> Change password</h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div>
//             <label className="label">Current password</label>
//             <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
//           </div>
//           <div>
//             <label className="label">New password</label>
//             <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
//           </div>
//         </div>
//         <button type="submit" disabled={changingPw} className="btn-secondary">
//           {changingPw ? "Updating..." : "Update password"}
//         </button>
//       </form>
//     </div>
//   );
// }

import React, { useState } from "react";
import toast from "react-hot-toast";
import { FiSave, FiLock, FiFileText, FiZap, FiBell } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import FileUpload from "../components/FileUpload.jsx";
import {
  enablePushNotifications,
  disablePushNotifications,
} from "../services/push.js";

export default function Profile() {
  const { user, updateUserLocal } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    location: user?.location || "",
    headline: user?.headline || "",
    skills: (user?.skills || []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [pushEnabled, setPushEnabled] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const { data } = await api.put("/users/me", payload);
      updateUserLocal(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const { data } = await api.post("/users/me/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUserLocal({
        resumeUrl: data.resumeUrl,
        resumeFileName: data.resumeFileName,
      });
      setResumeFile(null);
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingResume(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/users/me/password", pwForm);
      toast.success("Password updated");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPw(false);
    }
  };

  const runResumeAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    try {
      const { data } = await api.post("/ai/analyze-resume", {});
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysisError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const togglePush = async () => {
    setTogglingPush(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications();
        await api.put("/push/preferences", { push: false });
        setPushEnabled(false);
        toast.success("Push notifications disabled");
      } else {
        const result = await enablePushNotifications();
        if (result.status === "subscribed") {
          setPushEnabled(true);
          toast.success("Push notifications enabled");
        } else if (result.status === "not_configured") {
          toast.error(
            "Push notifications aren't configured on this server yet",
          );
        } else if (result.status === "denied") {
          toast.error("Notification permission was denied");
        } else {
          toast.error("Push notifications aren't supported in this browser");
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingPush(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        Your profile
      </h1>
      <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-8">
        Manage your personal information and account settings
      </p>

      <form onSubmit={saveProfile} className="card p-6 sm:p-8 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Personal information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input bg-slate-50 dark:bg-slate-900"
              value={user?.email || ""}
              disabled
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 123 4567"
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        {user?.role === "seeker" && (
          <>
            <div>
              <label className="label">Headline</label>
              <input
                className="input"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Frontend Developer"
              />
            </div>
            <div>
              <label className="label">Skills (comma separated)</label>
              <input
                className="input"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, JavaScript, CSS"
              />
            </div>
          </>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          <FiSave size={16} /> {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {user?.role === "seeker" && (
        <div className="card p-6 sm:p-8 mt-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FiFileText size={16} /> Resume
          </h2>
          <FileUpload
            file={resumeFile}
            onChange={setResumeFile}
            existingFileName={user?.resumeFileName}
          />
          {resumeFile && (
            <button
              onClick={uploadResume}
              disabled={uploadingResume}
              className="btn-primary"
            >
              {uploadingResume ? "Uploading..." : "Upload resume"}
            </button>
          )}
        </div>
      )}

      {user?.role === "seeker" && (
        <div className="card p-6 sm:p-8 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FiZap size={16} /> AI Resume Analyzer
            </h2>
            <button
              onClick={runResumeAnalysis}
              disabled={analyzing || !user?.resumeFileName}
              className="btn-primary"
            >
              {analyzing ? "Analyzing..." : "Analyze my resume"}
            </button>
          </div>

          {!user?.resumeFileName && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload a resume above first, then run the analysis.
            </p>
          )}

          {analysisError && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 p-4 text-sm text-amber-700 dark:text-amber-300">
              {analysisError}
            </div>
          )}

          {analysis && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-primary-600 dark:text-primary-400">
                    {analysis.score}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {analysis.summary}
                </p>
              </div>
              {analysis.strengths?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    Strengths
                  </h3>
                  <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.suggestions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    Suggestions
                  </h3>
                  <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.missingKeywords?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    Consider adding these keywords
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingKeywords.map((k) => (
                      <span
                        key={k}
                        className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card p-6 sm:p-8 mt-6 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FiBell size={16} /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Push notifications
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get notified about messages, application updates, and interviews
            </p>
          </div>
          <button
            onClick={togglePush}
            disabled={togglingPush}
            className={pushEnabled ? "btn-secondary" : "btn-primary"}
          >
            {togglingPush ? "..." : pushEnabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      <form
        onSubmit={changePassword}
        className="card p-6 sm:p-8 mt-6 space-y-4"
      >
        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FiLock size={16} /> Change password
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, currentPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, newPassword: e.target.value })
              }
            />
          </div>
        </div>
        <button type="submit" disabled={changingPw} className="btn-secondary">
          {changingPw ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
