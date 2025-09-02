// src/sources/index.ts
import { fetchWTTJ } from './wttj.js';
// On importera les autres sources ici plus tard
// import { fetchIndeed } from './indeed.js';
// import { fetchLinkedIn } from './linkedin.js';

// On définit un type pour nos fonctions de scraping pour être cohérent
type ScraperFunction = (jobTitle: string, location: string) => Promise<void>;

// On crée un tableau de toutes nos sources actives
export const sources: ScraperFunction[] = [
  fetchWTTJ,
  // fetchIndeed,
  // fetchLinkedIn,
];

// Une fonction pour lancer toutes les sources en parallèle
export async function fetchAllSources(jobTitle: string, location:string) {
  console.log(`▶ Lancement de la collecte pour ${sources.length} source(s)...`);
  // Promise.all permet d'attendre que toutes les promesses (tous les scrapers) se terminent
  await Promise.all(
    sources.map(scraper => scraper(jobTitle, location))
  );
  console.log("✅ Toutes les sources ont été collectées.");
}
