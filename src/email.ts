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

  // Transporteur SMTP Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "julien.medina16@gmail.com",        // ⚠️ remplace par ton adresse Gmail
      pass: "bfth zdau cnho lpmw",        // ⚠️ le mot de passe d’application
    },
  });

  // Envoi
  await transporter.sendMail({
    from: '"Job Agent" <julien.medina16@gmail.com>',
    to: "julien.medina16@gmail.com",         // où tu veux recevoir les offres
    subject: "Digest des offres du jour",
    html,
  });

  console.log("📧 Email envoyé !");
}
