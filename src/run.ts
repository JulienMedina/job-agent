// src/run.ts
import { fetchWTTJ } from "./sources/wttj.js";
import { scoreAll, selectTop } from "./score.js";
import { sendDigest } from "./email.js";

async function main() {
  console.log("▶ Collecte…");
  await fetchWTTJ("Développeur", "Île-de-France");

  console.log("⚖︎ Scoring…");
  scoreAll();

  console.log("🏆 Sélection Top…");
  const top = selectTop(20, 30);

  if (!top.length) {
    console.log("Pas d'offres pertinentes aujourd'hui.");
    return;
  }

  console.log(`📧 Envoi de ${top.length} offres par email…`);
  await sendDigest(top);
}

main().catch(console.error);
