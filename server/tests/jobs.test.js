process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../server.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

let employerToken, seekerToken;

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const registerEmployer = async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Aria Chen", email: "aria@test.com", password: "password123",
    role: "employer", companyName: "NovaTech Labs",
  });
  return res.body.token;
};

const registerSeeker = async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Jordan Lee", email: "jordan@test.com", password: "password123", role: "seeker",
  });
  return res.body.token;
};

describe("Jobs", () => {
  beforeEach(async () => {
    employerToken = await registerEmployer();
    seekerToken = await registerSeeker();
  });

  test("employer can create a job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${employerToken}`)
      .send({
        title: "Frontend Developer",
        description: "Build great UI",
        location: "Remote",
        remote: true,
        type: "Full-Time",
        experience: "1-2 Years",
        salaryMin: 60000,
        salaryMax: 90000,
        skills: ["React"],
      });
    expect(res.status).toBe(201);
    expect(res.body.job.title).toBe("Frontend Developer");
  });

  test("seeker cannot create a job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${seekerToken}`)
      .send({ title: "X", description: "Y", location: "Remote" });
    expect(res.status).toBe(403);
  });

  test("lists jobs with keyword filter", async () => {
    await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
      title: "Backend Engineer", description: "Node APIs", location: "NYC", type: "Full-Time",
    });
    await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
      title: "Product Designer", description: "Figma work", location: "NYC", type: "Full-Time",
    });

    const res = await request(app).get("/api/jobs?keyword=Backend");
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.jobs[0].title).toBe("Backend Engineer");
  });

  test("paginates job listings", async () => {
    for (let i = 0; i < 15; i++) {
      await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
        title: `Job ${i}`, description: "desc", location: "Remote", type: "Full-Time",
      });
    }
    const res = await request(app).get("/api/jobs?page=2&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(5);
    expect(res.body.totalResults).toBe(15);
  });

  test("only job owner can update it", async () => {
    const create = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
      title: "Job A", description: "desc", location: "Remote",
    });
    const otherEmployerToken = (await request(app).post("/api/auth/register").send({
      name: "Other", email: "other@test.com", password: "password123",
      role: "employer", companyName: "Other Co",
    })).body.token;

    const res = await request(app)
      .put(`/api/jobs/${create.body.job._id}`)
      .set("Authorization", `Bearer ${otherEmployerToken}`)
      .send({ title: "Hacked title" });
    expect(res.status).toBe(403);
  });

  test("deleting a job removes it", async () => {
    const create = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
      title: "Temp Job", description: "desc", location: "Remote",
    });
    const del = await request(app)
      .delete(`/api/jobs/${create.body.job._id}`)
      .set("Authorization", `Bearer ${employerToken}`);
    expect(del.status).toBe(200);

    const get = await request(app).get(`/api/jobs/${create.body.job._id}`);
    expect(get.status).toBe(404);
  });

  test("seeker can save and unsave a job", async () => {
    const create = await request(app).post("/api/jobs").set("Authorization", `Bearer ${employerToken}`).send({
      title: "Save Me", description: "desc", location: "Remote",
    });
    const jobId = create.body.job._id;

    const save = await request(app).post(`/api/jobs/${jobId}/save`).set("Authorization", `Bearer ${seekerToken}`);
    expect(save.body.saved).toBe(true);

    const unsave = await request(app).post(`/api/jobs/${jobId}/save`).set("Authorization", `Bearer ${seekerToken}`);
    expect(unsave.body.saved).toBe(false);
  });
});
