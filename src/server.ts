import "./env.js";
import express from "express";
import { spawn } from "node:child_process";
import { selectTop } from "./score.js";

const app = express();

// NOUVELLE ROUTE POUR LE HEALTHCHECK
app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

app.get("/run", (_req, res) => {
  // === LA CORRECTION EST ICI ===
  // On remplace "npx ts-node --esm src/run.ts" par "node dist/run.js"
  const child = spawn("node", ["dist/run.js"], {
    cwd: process.cwd(),
    stdio: "inherit", // "inherit" est super pour voir les logs du scraper directement dans les logs du serveur
    env: process.env,
  });
  // =============================

  child.on("close", (code) => {
    if (code === 0) res.json({ ok: true });
    else res.status(500).json({ ok: false, code });
  });
});

app.get("/top", (_req, res) => {
  try {
    const limit = Number(_req.query.limit ?? 10);
    const minScore = Number(_req.query.minScore ?? 30);
    const topResults = selectTop(limit, minScore);
    res.json(topResults)
  } catch (error) {
    console.error("Error selecting top results:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }

});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Scraper API ready on :${PORT}`));
