// src/score.ts
import { updateScore, getJobsForScoring, getTopJobs } from "./db.js";

// Ajuste librement ces listes
const POSITIVE = [
  "react", "next", "frontend", "front-end",
  "fullstack", "node", "typescript", "docker",
  "postgres", "n8n", "automation", "ia", "ml"
];

const BONUS = [
  "junior", "alternance", "apprentissage", "work-study",
  "remote", "télétravail", "hybride"
];

const NEGATIVE = ["senior", "lead", "staff", "architecte", "expert", "principal"];

export function scoreAll() {
  const jobs = getJobsForScoring();

  for (const j of jobs) {
    const text = `${j.title ?? ""} ${j.desc ?? ""}`.toLowerCase();

    let score = 0;

    // pondérations simples
    for (const kw of POSITIVE) if (text.includes(kw)) score += 12;
    for (const kw of BONUS)    if (text.includes(kw)) score += 10;
    for (const kw of NEGATIVE) if (text.includes(kw)) score -= 18;

    // heuristiques rapides
    if (/(react|next)/.test(text) && /(node|typescript)/.test(text)) score += 10; // combo FE/FS
    if (/remote|télétravail|hybride/.test(text)) score += 5;

    // bornes
    if (score < -50) score = -50;
    if (score > 100) score = 100;

    updateScore(j.id, score);
  }
}

export function selectTop(limit = 30, minScore = 30) {
  return getTopJobs(limit, minScore);
}
