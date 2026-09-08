import JobEvent from "../models/JobEvent.js";

/**
 * Records a real analytics event. This is intentionally fire-and-forget and
 * swallows its own errors so that a logging failure never breaks the primary
 * request (applying for a job, viewing a job, etc). Analytics dashboards read
 * back from this collection - there is no hardcoded/fake data anywhere.
 */
export const recordEvent = async (type, { job, application, employer, actor, meta } = {}) => {
  try {
    let employerId = employer;
    if (!employerId && job?.employer) employerId = job.employer;
    await JobEvent.create({ type, job, application, employer: employerId, actor, meta });
  } catch (err) {
    console.error(`Failed to record analytics event "${type}" (non-fatal):`, err.message);
  }
};
