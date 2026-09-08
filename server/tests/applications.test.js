process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../server.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const setupJobAndUsers = async () => {
  const employer = await request(app).post("/api/auth/register").send({
    name: "Aria Chen", email: "aria@test.com", password: "password123",
    role: "employer", companyName: "NovaTech Labs",
  });
  const seeker = await request(app).post("/api/auth/register").send({
    name: "Jordan Lee", email: "jordan@test.com", password: "password123", role: "seeker",
  });

  // give the seeker a profile resume so they can apply without uploading a file
  await request(app).put("/api/users/me").set("Authorization", `Bearer ${seeker.body.token}`).send({
    name: "Jordan Lee",
  });

  const job = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employer.body.token}`).send({
    title: "Frontend Developer", description: "Build UI", location: "Remote",
  });

  return { employerToken: employer.body.token, seekerToken: seeker.body.token, jobId: job.body.job._id };
};

describe("Applications", () => {
  test("seeker cannot apply without a resume", async () => {
    const { seekerToken, jobId } = await setupJobAndUsers();
    const res = await request(app)
      .post(`/api/applications/${jobId}`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ coverLetter: "Hi" });
    expect(res.status).toBe(400);
  });

  test("seeker can apply with a resume on profile, employer sees applicant", async () => {
    const { employerToken, seekerToken, jobId } = await setupJobAndUsers();

    await request(app).put("/api/users/me").set("Authorization", `Bearer ${seekerToken}`).send({});
    // Simulate a resume already on file by uploading via the resume field is required in real flow;
    // here we directly attach a text file as resume through multipart to the profile endpoint.
    await request(app)
      .post("/api/users/me/resume")
      .set("Authorization", `Bearer ${seekerToken}`)
      .attach("resume", Buffer.from("dummy pdf content"), "resume.pdf");

    const apply = await request(app)
      .post(`/api/applications/${jobId}`)
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ coverLetter: "Excited to apply" });
    expect(apply.status).toBe(201);

    const applicants = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set("Authorization", `Bearer ${employerToken}`);
    expect(applicants.status).toBe(200);
    expect(applicants.body.applications.length).toBe(1);
  });

  test("prevents duplicate applications", async () => {
    const { seekerToken, jobId } = await setupJobAndUsers();
    await request(app)
      .post("/api/users/me/resume")
      .set("Authorization", `Bearer ${seekerToken}`)
      .attach("resume", Buffer.from("dummy pdf content"), "resume.pdf");

    await request(app).post(`/api/applications/${jobId}`).set("Authorization", `Bearer ${seekerToken}`).send({});
    const second = await request(app).post(`/api/applications/${jobId}`).set("Authorization", `Bearer ${seekerToken}`).send({});
    expect(second.status).toBe(400);
  });

  test("employer can update application status", async () => {
    const { employerToken, seekerToken, jobId } = await setupJobAndUsers();
    await request(app)
      .post("/api/users/me/resume")
      .set("Authorization", `Bearer ${seekerToken}`)
      .attach("resume", Buffer.from("dummy pdf content"), "resume.pdf");

    const apply = await request(app).post(`/api/applications/${jobId}`).set("Authorization", `Bearer ${seekerToken}`).send({});
    const appId = apply.body.application._id;

    const update = await request(app)
      .put(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ status: "Interview Scheduled" });
    expect(update.status).toBe(200);
    expect(update.body.application.status).toBe("Interview Scheduled");
  });

  test("rejects invalid status value", async () => {
    const { employerToken, seekerToken, jobId } = await setupJobAndUsers();
    await request(app)
      .post("/api/users/me/resume")
      .set("Authorization", `Bearer ${seekerToken}`)
      .attach("resume", Buffer.from("dummy pdf content"), "resume.pdf");
    const apply = await request(app).post(`/api/applications/${jobId}`).set("Authorization", `Bearer ${seekerToken}`).send({});
    const appId = apply.body.application._id;

    const update = await request(app)
      .put(`/api/applications/${appId}/status`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ status: "Not A Real Status" });
    expect(update.status).toBe(400);
  });
});
