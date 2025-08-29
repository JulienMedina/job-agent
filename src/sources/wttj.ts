import { chromium } from "playwright";
import { upsertJob } from "../db.js";

export async function fetchWTTJ(query: string, location?: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(query)}${location ? `&aroundQuery=${encodeURIComponent(location)}` : ""}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Tente d'accepter la bannière cookies si présente
  try {
    const consent = page.getByRole('button', { name: /accepter|accept|agree/i });
    if (await consent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consent.click({ timeout: 2000 }).catch(() => {});
    }
  } catch {}

  // Attendre que la page charge les résultats (JS dynamique)
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // Scroll pour déclencher lazy-loading
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await page.waitForTimeout(600);
  }

  // Extraire les offres via une évaluation en chaîne pour éviter les helpers de bundling (ex: __name)
  const jobs = await page.evaluate(`(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/fr/companies/"][href*="/jobs/"]'));
    const uniq = new Map();
    for (const a of anchors) {
      if (a instanceof HTMLAnchorElement && !uniq.has(a.href)) uniq.set(a.href, a);
    }
    const items = Array.from(uniq.values()).map((a) => {
      const card = a.closest('article') || a.closest('[data-testid*="job-card"]') || a.parentElement;
      const pickText = (sel) => (card && card.querySelector(sel) && card.querySelector(sel).textContent || '').trim();
      const title = pickText('h3, h2') || (a.textContent || '').trim();
      const company = pickText('[data-testid*="company"], [class*="company" i]');
      const location = pickText('[data-testid*="location"], [class*="location" i]');
      const desc = ((card && card.textContent) || '').trim().slice(0, 300);
      return { title, company, location, url: a.href, desc };
    }).filter(j => j.title && j.url);
    return items;
  })()`) as Array<{ title: string; company: string; location: string; url: string; desc: string }>;

  console.log(`📊 Trouvé ${jobs.length} offres sur WTTJ`);

  for (const j of jobs) {
    upsertJob({
      id: j.url,
      source: "wttj",
      title: j.title,
      company: j.company,
      location: j.location,
      url: j.url,
      published_at: new Date().toISOString(),
      desc: j.desc,
    });
    console.log(`✅ Enregistré: ${j.title} @ ${j.company}`);
  }

  await browser.close();
}
