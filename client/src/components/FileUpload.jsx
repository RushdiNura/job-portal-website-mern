import React, { useRef, useState } from "react";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";

const ACCEPTED = [".pdf", ".doc", ".docx"];

export default function FileUpload({ file, onChange, existingFileName }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const validate = (f) => {
    if (!f) return false;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError("Only PDF, DOC, and DOCX files are supported.");
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be smaller than 5MB.");
      return false;
    }
    setError("");
    return true;
  };

  const handleFiles = (files) => {
    const f = files?.[0];
    if (f && validate(f)) onChange(f);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? "border-primary-400 bg-primary-50" : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <FiFile size={18} />
            <span className="text-sm font-medium">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-slate-400 hover:text-red-500"
              aria-label="Remove file"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <>
            <FiUploadCloud className="mx-auto text-slate-400 mb-2" size={28} />
            <p className="text-sm text-slate-600">
              <span className="text-primary-600 font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
            {existingFileName && (
              <p className="text-xs text-slate-500 mt-2">Current resume on file: {existingFileName}</p>
            )}
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
