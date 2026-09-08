import fs from "fs";
import path from "path";

/**
 * Best-effort plain-text extraction from an uploaded resume file, used as
 * input to the AI analyzer. PDF/DOC parsing libraries are intentionally kept
 * out of the core dependency list to avoid bloating the base install; if
 * `pdf-parse` (or similar) is present it will be used automatically, and this
 * degrades to "no extractable text" (surfaced honestly to the analyzer caller)
 * otherwise rather than silently returning garbage.
 */
export const extractResumeText = async (filePath) => {
  const absolute = path.resolve("." + filePath);
  const ext = path.extname(absolute).toLowerCase();

  if (!fs.existsSync(absolute)) return "";

  if (ext === ".pdf") {
    try {
      const { default: pdfParse } = await import("pdf-parse");
      const buffer = fs.readFileSync(absolute);
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err) {
      console.warn("pdf-parse not available or failed - install it to enable PDF text extraction:", err.message);
      return "";
    }
  }

  // .doc/.docx text extraction would go here (e.g. via 'mammoth' for .docx).
  // Left unimplemented deliberately rather than returning garbled binary content.
  return "";
};
