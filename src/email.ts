import "./env.js";
import nodemailer from "nodemailer";

export async function sendDigest(jobs: any[]) {
  // Génération du HTML
  let html = `<h2>Top ${jobs.length} offres</h2>`;
  html += `<ul style="font-family: Arial, sans-serif; line-height:1.4">`;

  for (const j of jobs) {
    html += `
      <li style="margin-bottom:12px">
        <b>${j.title}</b> — ${j.company} (${j.location || "?"})<br/>
        Score: ${j.score} <br/>
        <a href="${j.url}" target="_blank">Voir l'offre</a>
      </li>
    `;
  }
  html += `</ul>`;

  // Transporteur SMTP configurable via variables d'environnement
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Envoi
  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Job Agent" <no-reply@example.com>',
    to: process.env.MAIL_TO || process.env.SMTP_USER || "",
    subject: "Digest des offres du jour",
    html,
  });

  console.log("📧 Email envoyé !");
}

