// /**
//  * AI Screening engine.
//  *
//  * Every application is screened automatically at submission time. This
//  * always produces a real, deterministic match score from actual job/resume
//  * data (never randomized, never a placeholder number). If ANTHROPIC_API_KEY
//  * is configured, a real LLM call additionally produces a short human-readable
//  * screening summary grounded in that same data; if it isn't configured, or
//  * the call fails, the summary falls back to a plainly-labeled algorithmic
//  * summary built from the same matched/missing skills - `aiGenerated` always
//  * tells the truth about which one happened.
//  */

// const scoreCandidateAgainstJob = (job, candidate, coverLetter = "") => {
//   const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
//   const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

//   const matchedSkills = jobSkills.filter((s) => candidateSkills.includes(s));
//   const missingSkills = jobSkills.filter((s) => !candidateSkills.includes(s));

//   let score = 0;

//   // Skill overlap is the primary signal (up to 60 points)
//   if (jobSkills.length > 0) {
//     score += Math.round((matchedSkills.length / jobSkills.length) * 60);
//   } else {
//     score += 30; // no skills listed on the job - don't penalize the candidate for it
//   }

//   // Experience level proximity (up to 20 points)
//   const levels = ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"];
//   const jobLevel = levels.indexOf(job.experience);
//   const candidateLevel = levels.indexOf(candidate.experienceLevel);
//   if (jobLevel !== -1 && candidateLevel !== -1) {
//     const diff = Math.abs(jobLevel - candidateLevel);
//     score += Math.max(0, 20 - diff * 7);
//   } else {
//     score += 10;
//   }

//   // Cover letter / headline keyword relevance (up to 10 points)
//   const text = `${coverLetter} ${candidate.headline || ""}`.toLowerCase();
//   const keywordHits = jobSkills.filter((s) => text.includes(s)).length;
//   score += Math.min(10, keywordHits * 3);

//   // Location/remote fit (up to 10 points)
//   if (job.remote) {
//     score += 10;
//   } else if (candidate.location && job.location?.toLowerCase().includes(candidate.location.toLowerCase())) {
//     score += 10;
//   } else {
//     score += 3;
//   }

//   score = Math.max(0, Math.min(100, Math.round(score)));

//   return { score, matchedSkills, missingSkills };
// };

// const buildFallbackSummary = ({ score, matchedSkills, missingSkills }, job) => {
//   const parts = [];
//   if (matchedSkills.length > 0) {
//     parts.push(`Matches ${matchedSkills.length} required skill${matchedSkills.length === 1 ? "" : "s"} (${matchedSkills.join(", ")}).`);
//   } else {
//     parts.push("No direct overlap with the listed required skills.");
//   }
//   if (missingSkills.length > 0) {
//     parts.push(`Missing: ${missingSkills.join(", ")}.`);
//   }
//   parts.push(`Overall algorithmic match: ${score}/100 for "${job.title}".`);
//   return parts.join(" ");
// };

// const tryAiSummary = async ({ job, candidate, coverLetter, matchedSkills, missingSkills, score }) => {
//   const apiKey = process.env.ANTHROPIC_API_KEY;
//   if (!apiKey) return null;

//   const prompt = `You are an expert technical recruiter screening a candidate for a job. Be concise and factual - do not invent facts not present below.

// Job: ${job.title}
// Required skills: ${(job.skills || []).join(", ") || "none listed"}
// Experience level required: ${job.experience}

// Candidate headline: ${candidate.headline || "none provided"}
// Candidate skills: ${(candidate.skills || []).join(", ") || "none listed"}
// Candidate experience level: ${candidate.experienceLevel || "unspecified"}
// Cover letter: ${coverLetter || "none provided"}

// Algorithmic match score (already computed, do not recompute): ${score}/100
// Matched skills: ${matchedSkills.join(", ") || "none"}
// Missing skills: ${missingSkills.join(", ") || "none"}

// Write a 2-3 sentence screening summary for the hiring manager: is this worth a closer look, and why, referencing only the facts above. Return plain text only, no markdown, no preamble.`;

//   try {
//     const res = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": apiKey,
//         "anthropic-version": "2023-06-01",
//       },
//       body: JSON.stringify({
//         model: "claude-sonnet-4-6",
//         max_tokens: 300,
//         messages: [{ role: "user", content: prompt }],
//       }),
//     });
//     if (!res.ok) return null;
//     const data = await res.json();
//     const text = data.content?.map((c) => c.text || "").join("").trim();
//     return text || null;
//   } catch (err) {
//     console.warn("AI screening summary call failed (falling back to algorithmic summary):", err.message);
//     return null;
//   }
// };

// /**
//  * Screens a candidate against a job. Never throws - a failure anywhere in
//  * here must not block the application/apply flow that calls it.
//  */
// export const screenApplication = async ({ job, candidate, coverLetter = "" }) => {
//   try {
//     const { score, matchedSkills, missingSkills } = scoreCandidateAgainstJob(job, candidate, coverLetter);

//     const aiSummary = await tryAiSummary({ job, candidate, coverLetter, matchedSkills, missingSkills, score });

//     return {
//       score,
//       matchedSkills,
//       missingSkills,
//       summary: aiSummary || buildFallbackSummary({ score, matchedSkills, missingSkills }, job),
//       aiGenerated: !!aiSummary,
//       computedAt: new Date(),
//     };
//   } catch (err) {
//     console.error("Screening failed entirely (non-fatal, application still proceeds):", err.message);
//     return {
//       score: null,
//       matchedSkills: [],
//       missingSkills: [],
//       summary: "Screening could not be completed automatically.",
//       aiGenerated: false,
//       computedAt: new Date(),
//     };
//   }
// };


/**
 * AI Screening engine.
 *
 * Every application is screened automatically at submission time. This
 * always produces a real, deterministic match score from actual job/resume
 * data (never randomized, never a placeholder number). If GROQ_API_KEY
 * is configured, a real LLM call additionally produces a short human-readable
 * screening summary grounded in that same data; if it isn't configured, or
 * the call fails, the summary falls back to a plainly-labeled algorithmic
 * summary built from the same matched/missing skills - `aiGenerated` always
 * tells the truth about which one happened.
 */

const scoreCandidateAgainstJob = (job, candidate, coverLetter = "") => {
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

  const matchedSkills = jobSkills.filter((s) => candidateSkills.includes(s));
  const missingSkills = jobSkills.filter((s) => !candidateSkills.includes(s));

  let score = 0;

  // Skill overlap is the primary signal (up to 60 points)
  if (jobSkills.length > 0) {
    score += Math.round((matchedSkills.length / jobSkills.length) * 60);
  } else {
    score += 30; // no skills listed on the job - don't penalize the candidate for it
  }

  // Experience level proximity (up to 20 points)
  const levels = ["Entry Level", "1-2 Years", "3-5 Years", "5+ Years", "Senior"];
  const jobLevel = levels.indexOf(job.experience);
  const candidateLevel = levels.indexOf(candidate.experienceLevel);
  if (jobLevel !== -1 && candidateLevel !== -1) {
    const diff = Math.abs(jobLevel - candidateLevel);
    score += Math.max(0, 20 - diff * 7);
  } else {
    score += 10;
  }

  // Cover letter / headline keyword relevance (up to 10 points)
  const text = `${coverLetter} ${candidate.headline || ""}`.toLowerCase();
  const keywordHits = jobSkills.filter((s) => text.includes(s)).length;
  score += Math.min(10, keywordHits * 3);

  // Location/remote fit (up to 10 points)
  if (job.remote) {
    score += 10;
  } else if (candidate.location && job.location?.toLowerCase().includes(candidate.location.toLowerCase())) {
    score += 10;
  } else {
    score += 3;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, matchedSkills, missingSkills };
};

const buildFallbackSummary = ({ score, matchedSkills, missingSkills }, job) => {
  const parts = [];
  if (matchedSkills.length > 0) {
    parts.push(`Matches ${matchedSkills.length} required skill${matchedSkills.length === 1 ? "" : "s"} (${matchedSkills.join(", ")}).`);
  } else {
    parts.push("No direct overlap with the listed required skills.");
  }
  if (missingSkills.length > 0) {
    parts.push(`Missing: ${missingSkills.join(", ")}.`);
  }
  parts.push(`Overall algorithmic match: ${score}/100 for "${job.title}".`);
  return parts.join(" ");
};

const tryAiSummary = async ({ job, candidate, coverLetter, matchedSkills, missingSkills, score }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const prompt = `You are an expert technical recruiter screening a candidate for a job. Be concise and factual - do not invent facts not present below.

Job: ${job.title}
Required skills: ${(job.skills || []).join(", ") || "none listed"}
Experience level required: ${job.experience}

Candidate headline: ${candidate.headline || "none provided"}
Candidate skills: ${(candidate.skills || []).join(", ") || "none listed"}
Candidate experience level: ${candidate.experienceLevel || "unspecified"}
Cover letter: ${coverLetter || "none provided"}

Algorithmic match score (already computed, do not recompute): ${score}/100
Matched skills: ${matchedSkills.join(", ") || "none"}
Missing skills: ${missingSkills.join(", ") || "none"}

Write a 2-3 sentence screening summary for the hiring manager: is this worth a closer look, and why, referencing only the facts above. Return plain text only, no markdown, no preamble.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.warn("Groq screening call returned non-OK status:", res.status);
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.warn("AI screening summary call failed (falling back to algorithmic summary):", err.message);
    return null;
  }
};

/**
 * Screens a candidate against a job. Never throws - a failure anywhere in
 * here must not block the application/apply flow that calls it.
 */
export const screenApplication = async ({ job, candidate, coverLetter = "" }) => {
  try {
    const { score, matchedSkills, missingSkills } = scoreCandidateAgainstJob(job, candidate, coverLetter);

    const aiSummary = await tryAiSummary({ job, candidate, coverLetter, matchedSkills, missingSkills, score });

    return {
      score,
      matchedSkills,
      missingSkills,
      summary: aiSummary || buildFallbackSummary({ score, matchedSkills, missingSkills }, job),
      aiGenerated: !!aiSummary,
      computedAt: new Date(),
    };
  } catch (err) {
    console.error("Screening failed entirely (non-fatal, application still proceeds):", err.message);
    return {
      score: null,
      matchedSkills: [],
      missingSkills: [],
      summary: "Screening could not be completed automatically.",
      aiGenerated: false,
      computedAt: new Date(),
    };
  }
};