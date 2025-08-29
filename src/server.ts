import express from "express";
import { spawn } from "node:child_process";

const app = express();

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

app.listen(3000, () => console.log("Scraper API ready on :3000"));

