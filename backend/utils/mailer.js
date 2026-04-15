import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWinnerEmail = async ({ to, name, tournamentName, prizeAmount }) => {
  await transporter.sendMail({
    from: `"FireFireGG 🔥" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🏆 Congratulations! You are the Winner — FireFireGG",
    html: `
      <div style="font-family:Arial,sans-serif;background:#050508;color:#e2e8f0;padding:32px;border-radius:16px;max-width:520px;margin:auto;border:1px solid rgba(250,204,21,0.3)">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:48px">🏆</div>
          <h1 style="color:#facc15;font-size:26px;margin:8px 0">Congratulations, ${name}!</h1>
          <p style="color:#facc15;font-size:15px;margin:0">You are the Winner! 🎉</p>
        </div>
        <div style="background:rgba(250,204,21,0.07);border:1px solid rgba(250,204,21,0.2);border-radius:12px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#94a3b8;font-size:13px;padding:6px 0">Tournament</td>
              <td style="color:#fff;font-weight:bold;font-size:13px;text-align:right">${tournamentName}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8;font-size:13px;padding:6px 0">Prize Amount</td>
              <td style="color:#facc15;font-weight:900;font-size:20px;text-align:right">&#8377;${Number(prizeAmount).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
          <p style="color:#4ade80;font-weight:bold;font-size:14px;margin:0">📞 Our team will connect to you instantly!!</p>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center;margin:0">
          This is an automated message from <strong style="color:#06b6d4">FireFireGG</strong>.<br/>Do not reply to this email.
        </p>
      </div>
    `,
  });
};
