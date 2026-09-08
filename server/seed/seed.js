import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import Interview from "../models/Interview.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import JobEvent from "../models/JobEvent.js";

dotenv.config();

const employers = [
  { name: "Aria Chen", email: "employer1@demo.com", companyName: "NovaTech Labs", industry: "Software", location: "San Francisco, CA" },
  { name: "Marcus Reed", email: "employer2@demo.com", companyName: "BrightPath Health", industry: "Healthcare", location: "Austin, TX" },
  { name: "Priya Nair", email: "employer3@demo.com", companyName: "Fieldstone Finance", industry: "Finance", location: "New York, NY" },
];

const seekers = [
  { name: "Jordan Lee", email: "seeker1@demo.com", headline: "Frontend Developer", skills: ["React", "JavaScript", "CSS"] },
  { name: "Sam Patel", email: "seeker2@demo.com", headline: "Backend Engineer", skills: ["Node.js", "MongoDB", "Express"] },
  { name: "Taylor Brooks", email: "seeker3@demo.com", headline: "Full-Stack Developer", skills: ["React", "Node.js", "AWS"] },
];

const jobTemplates = [
  { title: "Frontend Developer", type: "Full-Time", experience: "1-2 Years", location: "Remote", remote: true, salaryMin: 65000, salaryMax: 90000, category: "Engineering", skills: ["React", "JavaScript", "Tailwind CSS"] },
  { title: "Backend Engineer", type: "Full-Time", experience: "3-5 Years", location: "San Francisco, CA", remote: false, salaryMin: 95000, salaryMax: 130000, category: "Engineering", skills: ["Node.js", "MongoDB", "Express"] },
  { title: "Product Designer", type: "Full-Time", experience: "3-5 Years", location: "Austin, TX", remote: false, salaryMin: 80000, salaryMax: 110000, category: "Design", skills: ["Figma", "UI/UX", "Prototyping"] },
  { title: "DevOps Intern", type: "Internship", experience: "Entry Level", location: "Remote", remote: true, salaryMin: 20, salaryMax: 25, category: "Engineering", skills: ["Docker", "CI/CD", "Linux"] },
  { title: "Data Analyst", type: "Contract", experience: "1-2 Years", location: "New York, NY", remote: false, salaryMin: 60000, salaryMax: 75000, category: "Data", skills: ["SQL", "Python", "Excel"] },
  { title: "Senior Full-Stack Engineer", type: "Full-Time", experience: "5+ Years", location: "Remote", remote: true, salaryMin: 130000, salaryMax: 170000, category: "Engineering", skills: ["React", "Node.js", "AWS", "MongoDB"] },
  { title: "Marketing Coordinator", type: "Part-Time", experience: "Entry Level", location: "Austin, TX", remote: false, salaryMin: 25, salaryMax: 35, category: "Marketing", skills: ["SEO", "Content Writing", "Social Media"] },
  { title: "QA Engineer", type: "Full-Time", experience: "1-2 Years", location: "New York, NY", remote: false, salaryMin: 70000, salaryMax: 90000, category: "Engineering", skills: ["Testing", "Cypress", "Jest"] },
  { title: "Financial Analyst", type: "Full-Time", experience: "3-5 Years", location: "New York, NY", remote: false, salaryMin: 85000, salaryMax: 115000, category: "Finance", skills: ["Excel", "Modeling", "Forecasting"] },
  { title: "Registered Nurse", type: "Full-Time", experience: "3-5 Years", location: "Austin, TX", remote: false, salaryMin: 75000, salaryMax: 95000, category: "Healthcare", skills: ["Patient Care", "EHR", "Triage"] },
];

const destroyData = async () => {
  await Notification.deleteMany();
  await Interview.deleteMany();
  await Message.deleteMany();
  await Conversation.deleteMany();
  await JobEvent.deleteMany();
  await Application.deleteMany();
  await Job.deleteMany();
  await Company.deleteMany();
  await User.deleteMany();
  console.log("All data destroyed");
  process.exit();
};

const importData = async () => {
  await Notification.deleteMany();
  await Interview.deleteMany();
  await Message.deleteMany();
  await Conversation.deleteMany();
  await JobEvent.deleteMany();
  await Application.deleteMany();
  await Job.deleteMany();
  await Company.deleteMany();
  await User.deleteMany();

  // Admin account is provisioned directly by the seed script (never via public
  // registration - see authController.js for that security boundary).
  await User.create({
    name: "Platform Admin",
    email: "admin@demo.com",
    password: "password123",
    role: "admin",
  });

  const createdEmployers = [];
  for (const e of employers) {
    const user = await User.create({ name: e.name, email: e.email, password: "password123", role: "employer" });
    const company = await Company.create({
      owner: user._id,
      name: e.companyName,
      industry: e.industry,
      location: e.location,
      description: `${e.companyName} is a growing company in the ${e.industry.toLowerCase()} industry, hiring across engineering, design, and operations.`,
      size: "51-200 employees",
    });
    user.company = company._id;
    await user.save();
    createdEmployers.push({ user, company });
  }

  const createdSeekers = [];
  for (const s of seekers) {
    const user = await User.create({
      name: s.name,
      email: s.email,
      password: "password123",
      role: "seeker",
      headline: s.headline,
      skills: s.skills,
      location: "Remote",
    });
    createdSeekers.push(user);
  }

  const createdJobs = [];
  for (let i = 0; i < jobTemplates.length; i++) {
    const t = jobTemplates[i];
    const employer = createdEmployers[i % createdEmployers.length];
    const job = await Job.create({
      ...t,
      description: `We are looking for a talented ${t.title} to join ${employer.company.name}. You'll work with a collaborative team on impactful projects, own meaningful parts of the roadmap, and grow your skills fast.`,
      responsibilities: [
        "Collaborate with cross-functional teams",
        "Own features end-to-end",
        "Participate in code/design reviews",
      ],
      requirements: [
        `Experience level: ${t.experience}`,
        `Familiarity with: ${t.skills.join(", ")}`,
        "Strong communication skills",
      ],
      company: employer.company._id,
      employer: employer.user._id,
    });
    createdJobs.push(job);
  }

  // Create a few sample applications
  const app1 = await Application.create({
    job: createdJobs[0]._id,
    applicant: createdSeekers[0]._id,
    employer: createdJobs[0].employer,
    resumeUrl: "/uploads/resumes/sample-resume.pdf",
    resumeFileName: "jordan-lee-resume.pdf",
    coverLetter: "I'm excited to apply for this frontend role - React is my daily driver.",
    status: "Under Review",
    statusHistory: [{ status: "Applied" }, { status: "Under Review" }],
  });
  createdJobs[0].applicantsCount += 1;
  await createdJobs[0].save();

  const app2 = await Application.create({
    job: createdJobs[1]._id,
    applicant: createdSeekers[1]._id,
    employer: createdJobs[1].employer,
    resumeUrl: "/uploads/resumes/sample-resume.pdf",
    resumeFileName: "sam-patel-resume.pdf",
    coverLetter: "Backend systems and API design are what I love working on.",
    status: "Applied",
    statusHistory: [{ status: "Applied" }],
  });
  createdJobs[1].applicantsCount += 1;
  await createdJobs[1].save();

  // Sample interview for app1 (also flips its status, mirroring what the
  // interview-scheduling endpoint does in real usage)
  await Interview.create({
    application: app1._id,
    job: createdJobs[0]._id,
    employer: createdJobs[0].employer,
    candidate: createdSeekers[0]._id,
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    durationMinutes: 30,
    type: "Video",
    notes: "First-round screen with the hiring manager.",
    status: "Scheduled",
  });
  app1.status = "Interview Scheduled";
  app1.statusHistory.push({ status: "Interview Scheduled" });
  await app1.save();

  // Sample conversation + messages tied to app1's legitimate employer/candidate relationship
  const conversation = await Conversation.create({
    application: app1._id,
    job: createdJobs[0]._id,
    employer: createdJobs[0].employer,
    candidate: createdSeekers[0]._id,
    lastMessagePreview: "Looking forward to speaking with you!",
  });
  await Message.create([
    { conversation: conversation._id, sender: createdJobs[0].employer, text: "Thanks for applying! We'd like to schedule a quick call.", read: true },
    { conversation: conversation._id, sender: createdSeekers[0]._id, text: "Sounds great, looking forward to speaking with you!", read: false },
  ]);

  // A handful of real analytics events so the analytics dashboards have something to show
  await JobEvent.create([
    { type: "job_viewed", job: createdJobs[0]._id, employer: createdJobs[0].employer },
    { type: "job_viewed", job: createdJobs[0]._id, employer: createdJobs[0].employer },
    { type: "job_viewed", job: createdJobs[1]._id, employer: createdJobs[1].employer },
    { type: "application_submitted", job: createdJobs[0]._id, application: app1._id, employer: createdJobs[0].employer },
    { type: "application_submitted", job: createdJobs[1]._id, application: app2._id, employer: createdJobs[1].employer },
    { type: "interview_scheduled", job: createdJobs[0]._id, application: app1._id, employer: createdJobs[0].employer },
  ]);

  console.log("Seed data imported successfully");
  console.log("----------------------------------------");
  console.log("Demo accounts (all use password: password123)");
  console.log("  Admin:    admin@demo.com");
  employers.forEach((e) => console.log(`  Employer: ${e.email}`));
  seekers.forEach((s) => console.log(`  Seeker:   ${s.email}`));
  console.log("----------------------------------------");
  process.exit();
};

const run = async () => {
  await connectDB();
  if (process.argv.includes("-d")) {
    await destroyData();
  } else {
    await importData();
  }
};

run();
