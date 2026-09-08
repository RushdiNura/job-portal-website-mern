process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const registerEmployer = async (email = "aria@test.com") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Aria Chen", email, password: "password123", role: "employer", companyName: "NovaTech Labs",
  });
  return res.body;
};

const registerSeeker = async (email = "jordan@test.com") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Jordan Lee", email, password: "password123", role: "seeker",
  });
  return res.body;
};

const createAdmin = async () => {
  // Admins are never created through public registration - provisioned directly here,
  // mirroring how the real seed script does it.
  const user = await User.create({ name: "Admin", email: "admin@test.com", password: "password123", role: "admin" });
  const login = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "password123" });
  return login.body.token;
};

describe("Admin access control", () => {
  test("public registration cannot create an admin account", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Hacker", email: "hacker@test.com", password: "password123", role: "admin",
    });
    expect(res.status).toBe(400);
  });

  test("non-admin users are blocked from admin routes", async () => {
    const employer = await registerEmployer();
    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${employer.token}`);
    expect(res.status).toBe(403);
  });

  test("admin can access platform analytics with real counts", async () => {
    await registerEmployer();
    await registerSeeker();
    const adminToken = await createAdmin();

    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.analytics.employers).toBe(1);
    expect(res.body.analytics.candidates).toBe(1);
  });

  test("admin can deactivate a user and that user can no longer log in", async () => {
    const seeker = await registerSeeker();
    const adminToken = await createAdmin();

    const deactivate = await request(app)
      .put(`/api/admin/users/${seeker.user._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactivate.status).toBe(200);

    const loginAttempt = await request(app).post("/api/auth/login").send({
      email: "jordan@test.com", password: "password123",
    });
    expect(loginAttempt.status).toBe(403);
  });
});

describe("Interview scheduling", () => {
  const setup = async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();
    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});
    return { employer, seeker, applicationId: application.body.application._id };
  };

  test("employer can schedule an interview", async () => {
    const { employer, applicationId } = await setup();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post("/api/interviews")
      .set("Authorization", `Bearer ${employer.token}`)
      .send({ applicationId, scheduledAt: futureDate, durationMinutes: 30, type: "Video" });

    expect(res.status).toBe(201);
    expect(res.body.interview.status).toBe("Scheduled");
  });

  test("rejects a conflicting interview time for the same employer", async () => {
    const { employer, applicationId } = await setup();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    futureDate.setHours(10, 0, 0, 0);

    await request(app).post("/api/interviews").set("Authorization", `Bearer ${employer.token}`).send({
      applicationId, scheduledAt: futureDate.toISOString(), durationMinutes: 60, type: "Video",
    });

    // Second application, same employer, overlapping time slot
    const seeker2 = await registerSeeker("sam@test.com");
    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker2.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job2 = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Backend Engineer", description: "Build APIs", location: "Remote",
    });
    const app2 = await request(app).post(`/api/applications/${job2.body.job._id}`)
      .set("Authorization", `Bearer ${seeker2.token}`).send({});

    const overlapTime = new Date(futureDate.getTime() + 15 * 60000); // 15 min into the first interview
    const conflictRes = await request(app)
      .post("/api/interviews")
      .set("Authorization", `Bearer ${employer.token}`)
      .send({ applicationId: app2.body.application._id, scheduledAt: overlapTime.toISOString(), durationMinutes: 30, type: "Video" });

    expect(conflictRes.status).toBe(409);
  });

  test("rejects scheduling in the past", async () => {
    const { employer, applicationId } = await setup();
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await request(app).post("/api/interviews").set("Authorization", `Bearer ${employer.token}`).send({
      applicationId, scheduledAt: pastDate,
    });
    expect(res.status).toBe(400);
  });
});

describe("Conversation authorization boundary", () => {
  test("a candidate cannot start a conversation for someone else's application", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();
    const outsider = await registerSeeker("outsider@test.com");

    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});

    const res = await request(app)
      .post("/api/conversations/start")
      .set("Authorization", `Bearer ${outsider.token}`)
      .send({ applicationId: application.body.application._id });

    expect(res.status).toBe(403);
  });

  test("a third party cannot read messages in a conversation they are not part of", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();
    const outsiderEmployer = (await registerEmployer("outsider-employer@test.com"));

    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});

    const conv = await request(app).post("/api/conversations/start")
      .set("Authorization", `Bearer ${employer.token}`)
      .send({ applicationId: application.body.application._id });

    const res = await request(app)
      .get(`/api/conversations/${conv.body.conversation._id}/messages`)
      .set("Authorization", `Bearer ${outsiderEmployer.token}`);

    expect(res.status).toBe(403);
  });

  test("legitimate participants can exchange messages", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();

    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});

    const conv = await request(app).post("/api/conversations/start")
      .set("Authorization", `Bearer ${employer.token}`)
      .send({ applicationId: application.body.application._id });

    const sendRes = await request(app)
      .post(`/api/conversations/${conv.body.conversation._id}/messages`)
      .set("Authorization", `Bearer ${employer.token}`)
      .send({ text: "Hi, thanks for applying!" });
    expect(sendRes.status).toBe(201);

    const readRes = await request(app)
      .get(`/api/conversations/${conv.body.conversation._id}/messages`)
      .set("Authorization", `Bearer ${seeker.token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.messages.length).toBe(1);
  });
});

describe("Recommendations", () => {
  test("returns explainable, skill-matched recommendations", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();

    await request(app).put("/api/users/me").set("Authorization", `Bearer ${seeker.token}`).send({
      skills: ["React", "Node.js"],
    });

    await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "React Developer", description: "Build UI", location: "Remote", skills: ["React", "Node.js"],
    });
    await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Welder", description: "Weld things", location: "Remote", skills: ["Welding"],
    });

    const res = await request(app).get("/api/recommendations").set("Authorization", `Bearer ${seeker.token}`);
    expect(res.status).toBe(200);
    expect(res.body.recommendations.length).toBe(1);
    expect(res.body.recommendations[0].job.title).toBe("React Developer");
    expect(res.body.recommendations[0].reasons.length).toBeGreaterThan(0);
  });
});

describe("Application withdrawal", () => {
  test("candidate can withdraw their own application", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();
    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});

    const res = await request(app)
      .put(`/api/applications/${application.body.application._id}/withdraw`)
      .set("Authorization", `Bearer ${seeker.token}`);
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("Withdrawn");
  });

  test("another candidate cannot withdraw someone else's application", async () => {
    const employer = await registerEmployer();
    const seeker = await registerSeeker();
    const outsider = await registerSeeker("outsider2@test.com");
    await request(app).post("/api/users/me/resume").set("Authorization", `Bearer ${seeker.token}`)
      .attach("resume", Buffer.from("dummy"), "resume.pdf");
    const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.token}`).send({
      title: "Frontend Developer", description: "Build UI", location: "Remote",
    });
    const application = await request(app).post(`/api/applications/${job.body.job._id}`)
      .set("Authorization", `Bearer ${seeker.token}`).send({});

    const res = await request(app)
      .put(`/api/applications/${application.body.application._id}/withdraw`)
      .set("Authorization", `Bearer ${outsider.token}`);
    expect(res.status).toBe(403);
  });
});

describe("AI resume analyzer graceful degradation", () => {
  test("returns 503 with a clear message when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const seeker = await registerSeeker();
    const res = await request(app)
      .post("/api/ai/analyze-resume")
      .set("Authorization", `Bearer ${seeker.token}`)
      .send({});
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/not configured/i);
  });
});
