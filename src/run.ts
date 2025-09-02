// src/run.ts
import "./env.js";
import { fetchAllSources } from "./sources/index.js";
import { scoreAll, selectTop } from "./score.js";
import { sendDigest } from "./email.js";
// === IMPORTATION AJOUTÉE ===
import { cleanupOldJobs, compactDb, countJobs, markJobsAsSeen } from "./db.js";

async function main() {
  console.log("▶ Collecte…");
  const JOB_TITLE = process.env.JOB_TITLE ?? "Développeur";
  const JOB_LOCATION = process.env.JOB_LOCATION ?? "Île-de-France";
  await fetchAllSources(JOB_TITLE, JOB_LOCATION);

  console.log("⚖︎ Scoring…");
  scoreAll();

  console.log("🏆 Sélection Top (offres non vues uniquement)…");
  // La fonction selectTop appelle maintenant getTopJobs qui filtre les `seen=0`
  const top = selectTop(20, 30);

  if (!top.length) {
    console.log("Pas de NOUVELLES offres pertinentes aujourd'hui.");
    // Pas besoin de nettoyer si rien de neuf n'a été traité
    return;
  }

  console.log(`📧 Envoi de ${top.length} nouvelles offres par email…`);
  await sendDigest(top);

  // === ACTION AJOUTÉE ===
  // Une fois l'e-mail envoyé, on marque ces offres comme "vues"
  markJobsAsSeen(top.map(job => job.id));
  
  // --- Nettoyage (inchangé) ---
  const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? 90);
  const before = countJobs();
  const removed = cleanupOldJobs(RETENTION_DAYS);
  const after = countJobs();
  console.log(`[cleanup] kept=${after} removed=${removed} days=${RETENTION_DAYS}`);
  
  const isSunday = new Date().getDay() === 0;
  if (removed > 0 || isSunday) {
    console.log(`[cleanup] compaction…`);
    compactDb();
    console.log(`[cleanup] compaction done`);
  }
}

main().catch(console.error);
