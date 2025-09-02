// src/db.ts (ESM)
import "./env.js";
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
  // Ajout des champs optionnels pour la sélection
  score?: number;
  seen?: number;
};

// ...
const db = new Database(process.env.DB_PATH ?? 'data.db');
db.pragma('journal_mode = WAL');
// ... Schéma (inchangé) ...
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


// upsertJob (inchangé)
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

// updateScore (inchangé)
export function updateScore(id: string, score: number) {
  db.prepare(`UPDATE jobs SET score = ? WHERE id = ?`).run(score, id);
}

// === MODIFICATION ICI ===
// On ne sélectionne que les jobs qui n'ont pas encore été vus (`seen = 0`)
export function getTopJobs(limit: number, minScore: number): Job[] {
  return db.prepare(`
    SELECT * FROM jobs WHERE score >= ? AND seen = 0 ORDER BY score DESC LIMIT ?
  `).all(minScore, limit) as Job[];
}

// === NOUVELLE FONCTION ===
// On marque une liste de jobs comme "vus"
export function markJobsAsSeen(ids: string[]) {
  if (ids.length === 0) return;

  const stmt = db.prepare('UPDATE jobs SET seen = 1 WHERE id = ?');
  const transaction = db.transaction((jobIds: string[]) => {
    for (const id of jobIds) {
      stmt.run(id);
    }
  });

  transaction(ids);
  console.log(`[DB] Marqué ${ids.length} jobs comme vus.`);
}

// getJobsForScoring (inchangé)
export function getJobsForScoring() {
  return db.prepare(`SELECT id, title, desc FROM jobs`).all() as Array<{ id: string; title: string; desc: string }>;
}

// ... reste du fichier (cleanupOldJobs, etc.) inchangé
export function cleanupOldJobs(days = 90) {
  const stmt = db.prepare(`
    DELETE FROM jobs
    WHERE datetime(published_at) < datetime('now', ?)
  `);
  const info = stmt.run(`-${days} days`);
  return info.changes as number;
}
export function countJobs() {
  return (db.prepare(`SELECT COUNT(*) as n FROM jobs`).get() as any).n as number;
}
export function compactDb() {
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.exec('VACUUM');
}
