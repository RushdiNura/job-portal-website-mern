import { jest } from "@jest/globals";
process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../server.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

describe("Auth", () => {
  test("registers a new seeker", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jordan Lee",
      email: "jordan@test.com",
      password: "password123",
      role: "seeker",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("jordan@test.com");
    expect(res.body.user.password).toBeUndefined();
  });

  test("registers a new employer and creates a company", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Aria Chen",
      email: "aria@test.com",
      password: "password123",
      role: "employer",
      companyName: "NovaTech Labs",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.company).toBeDefined();
  });

  test("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send({
      name: "A", email: "dup@test.com", password: "password123", role: "seeker",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "B", email: "dup@test.com", password: "password123", role: "seeker",
    });
    expect(res.status).toBe(400);
  });

  test("rejects registration with invalid role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "A", email: "bad@test.com", password: "password123", role: "admin",
    });
    expect(res.status).toBe(400);
  });

  test("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Sam", email: "sam@test.com", password: "password123", role: "seeker",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "sam@test.com", password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("rejects login with wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Sam", email: "sam2@test.com", password: "password123", role: "seeker",
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "sam2@test.com", password: "wrongpass",
    });
    expect(res.status).toBe(401);
  });

  test("rejects protected route without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("returns current user with valid token", async () => {
    const register = await request(app).post("/api/auth/register").send({
      name: "Taylor", email: "taylor@test.com", password: "password123", role: "seeker",
    });
    const token = register.body.token;
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("taylor@test.com");
  });
});
