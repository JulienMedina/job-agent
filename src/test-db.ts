import { upsertJob, getTopJobs } from "./db.js";

upsertJob({
  id: "test1",
  source: "demo",
  title: "Développeur React",
  company: "Startup Cool",
  location: "Remote",
  url: "http://example.com",
  published_at: new Date().toISOString(),
  desc: "Job test React et Node.js"
});

console.log(getTopJobs(5, 0));
