/**
 * Video meeting integration point for interview scheduling.
 *
 * This project does not fabricate a fake video-call screen or a fake meeting link.
 * Instead, it defines a clean provider interface: if VIDEO_PROVIDER + credentials
 * are configured via environment variables, a real meeting is created through that
 * provider's API and its authenticated join URL is stored on the Interview record.
 * If no provider is configured, meetingUrl is left empty and the interview is still
 * scheduled normally (type "Video" interviews just show "meeting link pending" until
 * an employer adds one manually via `location`, or a provider is configured).
 *
 * To enable real video interviews, set in server/.env:
 *   VIDEO_PROVIDER=daily            # or "twilio", "zoom", etc.
 *   DAILY_API_KEY=...               # provider-specific credentials
 *
 * Then implement the corresponding branch below using that provider's SDK/API.
 * This keeps credentials on the backend only, per the security requirement.
 */
export const createVideoMeeting = async ({ interviewId, scheduledAt, durationMinutes }) => {
  const provider = process.env.VIDEO_PROVIDER;

  if (!provider) {
    return { meetingUrl: "", meetingProvider: "" };
  }

  if (provider === "daily") {
    if (!process.env.DAILY_API_KEY) {
      console.warn("VIDEO_PROVIDER=daily set but DAILY_API_KEY is missing - skipping meeting creation");
      return { meetingUrl: "", meetingProvider: "" };
    }
    // Example real integration (uncomment and adapt once you have a Daily.co account):
    //
    // const res = await fetch("https://api.daily.co/v1/rooms", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     name: `interview-${interviewId}`,
    //     properties: { exp: Math.floor(new Date(scheduledAt).getTime() / 1000) + durationMinutes * 60 },
    //   }),
    // });
    // const room = await res.json();
    // return { meetingUrl: room.url, meetingProvider: "daily" };
    console.warn("Daily.co integration is stubbed out - add DAILY_API_KEY and uncomment the API call to enable it");
    return { meetingUrl: "", meetingProvider: "" };
  }

  console.warn(`Unknown VIDEO_PROVIDER "${provider}" - no meeting was created`);
  return { meetingUrl: "", meetingProvider: "" };
};
