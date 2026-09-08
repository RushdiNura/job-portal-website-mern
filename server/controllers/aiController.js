import asyncHandler from "express-async-handler";
import { extractResumeText } from "../utils/resumeText.js";

/**
 * AI Resume Analyzer
 *
 * Calls Anthropic's API directly (server-side only - the key never reaches the
 * browser) when ANTHROPIC_API_KEY is set. If it is not set, this endpoint
 * returns 503 with a clear, honest message instead of fabricating a score or
 * feedback. The frontend is built to handle that response gracefully.
 */
export const analyzeResume = asyncHandler(async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    res.status(503);
    throw new Error(
      "AI resume analysis is not configured on this server. Set ANTHROPIC_API_KEY in server/.env to enable it."
    );
  }

  const user = req.user;
  if (!user.resumeUrl) {
    res.status(400);
    throw new Error("Upload a resume to your profile before requesting an analysis");
  }

  const resumeText = await extractResumeText(user.resumeUrl);
  if (!resumeText || resumeText.trim().length < 40) {
    res.status(422);
    throw new Error(
      "Couldn't extract readable text from your resume. Currently only text-based PDFs are supported for analysis."
    );
  }

  const targetRole = req.body?.targetRole || user.headline || "";

  const prompt = `You are an expert technical recruiter. Analyze the following resume text${targetRole ? ` for a "${targetRole}" role` : ""}.

Return ONLY valid JSON, no markdown fences, matching exactly this shape:
{
  "score": <integer 0-100>,
  "strengths": [<3-6 short strings>],
  "suggestions": [<3-6 short, actionable strings>],
  "missingKeywords": [<0-8 short strings of relevant keywords/skills that seem absent>],
  "summary": "<1-2 sentence overall summary>"
}

Resume text:
"""
${resumeText.slice(0, 12000)}
"""`;

  let apiResponse;
  try {
    apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    res.status(502);
    throw new Error("Could not reach the AI service. Please try again shortly.");
  }

  if (!apiResponse.ok) {
    res.status(502);
    throw new Error("The AI service returned an error. Please try again shortly.");
  }

  const data = await apiResponse.json();
  const rawText = data.content?.map((c) => c.text || "").join("") || "";

  let parsed;
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    res.status(502);
    throw new Error("The AI service returned an unexpected response format. Please try again.");
  }

  res.json({ success: true, analysis: parsed });
});
