// src/db.ts (ESM)
import Database from 'better-sqlite3';

export type Job = {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
  published_at: string; // ISO string
  desc: string;
};

// Use a local SQLite file
const db = new Database('data.db');
// Better concurrency and durability
db.pragma('journal_mode = WAL');

// Schema with scoring fields
db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  source TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  url TEXT,
  published_at TEXT,
  desc TEXT,
  score REAL DEFAULT 0,
  seen INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_jobs_score_pub ON jobs(score, published_at);
`);

export function upsertJob(job: Job) {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, source, title, company, location, url, published_at, desc)
    VALUES (@id, @source, @title, @company, @location, @url, @published_at, @desc)
    ON CONFLICT(id) DO UPDATE SET
      source=excluded.source,
      title=excluded.title,
      company=excluded.company,
      location=excluded.location,
      url=excluded.url,
      published_at=excluded.published_at,
      desc=excluded.desc
  `);
  stmt.run(job);
}

export function updateScore(id: string, score: number) {
  db.prepare(`UPDATE jobs SET score = ? WHERE id = ?`).run(score, id);
}

export function getTopJobs(limit: number, minScore: number) {
  return db.prepare(`
    SELECT * FROM jobs WHERE score >= ? ORDER BY score DESC LIMIT ?
  `).all(minScore, limit);
}

export function getJobsForScoring() {
  return db.prepare(`SELECT id, title, desc FROM jobs`).all() as Array<{ id: string; title: string; desc: string }>; 
}
