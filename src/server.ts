import "./env.js";
import express from "express";
import { spawn } from "node:child_process";
import { selectTop } from "./score.js";
import { chromium } from "playwright";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Healthcheck (pour Docker)
app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

// ✅ Endpoint générique pour n8n : POST /scrape
// Body JSON : { url: string, selectors?: { itemSelector: string, fields: {...} }, waitFor?: string }
app.post("/scrape", async (req, res) => {
  const { url, selectors, waitFor } = req.body || {};
  if (!url) return res.status(400).json({ error: "url manquante" });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => {});
    }

    // Scroll progressif pour charger les listes
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(800 + Math.floor(Math.random() * 600));
    }

    const sel =
      selectors || {
        itemSelector: ".job-card",
        fields: {
          title: ".job-title",
          company: ".company-name",
          location: ".job-location",
          url: "a.job-link@href",
          description: ".job-snippet",
        },
      };

    const offers = await page.$$eval(
      sel.itemSelector,
      (cards, fields: any) => {
   const get = (el: Element, q: string) => {
  if (!q) return "";

  // Cas "sélecteur@attribut", ex: "a@href"
  const at = q.indexOf("@");
  if (at !== -1) {
    const sel = q.slice(0, at).trim();
    const attr = q.slice(at + 1).trim();
    if (!sel || !attr) return "";
    const node = el.querySelector(sel);
    const val = node?.getAttribute(attr);
    return val ?? "";
  }

  // Cas "sélecteur" simple (texte)
  const node = el.querySelector(q);
  return node?.textContent?.trim() ?? "";
};

        return Array.from(cards)
          .map((el) => ({
            title: get(el, fields.title),
            company: get(el, fields.company),
            location: get(el, fields.location),
            url: get(el, fields.url),
            description: get(el, fields.description),
          }))
          .filter((o) => o.title && o.url);
      },
      sel.fields
    );

    res.json({ offers });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "scrape_failed" });
  } finally {
    await browser.close();
  }
});

// /run (utile pour un run complet legacy / debug)
app.get("/run", (_req, res) => {
  const child = spawn("node", ["dist/run.js"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  child.on("close", (code) => {
    if (code === 0) res.json({ ok: true });
    else res.status(500).json({ ok: false, code });
  });
});

// /top (debug / inspection des meilleurs en base)
app.get("/top", (_req, res) => {
  try {
    const limit = Number(_req.query.limit ?? 10);
    const minScore = Number(_req.query.minScore ?? 30);
    const topResults = selectTop(limit, minScore);
    res.json(topResults);
  } catch (error) {
    console.error("Error selecting top results:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Scraper API ready on :${PORT}`));
