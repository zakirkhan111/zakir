const nodemailer = require('nodemailer');

// Single reusable transporter built from SMTP env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const baseWrapper = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#0f766e;padding:24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;">ImpactHub</h1>
              <p style="color:#d1fae5;margin:4px 0 0;font-size:12px;">Community Projects &amp; Volunteer Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} ImpactHub — Saylani Community Impact Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[emailService] SMTP credentials not set — skipping actual send in dev.');
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'ImpactHub <no-reply@impacthub.com>',
    to,
    subject,
    html,
  });
}

async function sendWelcomeEmail(user) {
  const html = baseWrapper(
    'Welcome to ImpactHub',
    `<h2 style="color:#111827;">Welcome, ${user.name}! 🎉</h2>
     <p style="color:#4b5563;line-height:1.6;">
       Your account has been created successfully as a <b>${user.role}</b>.
       Start exploring community projects, applying as a volunteer, and making real impact today.
     </p>`
  );
  return sendEmail({ to: user.email, subject: 'Welcome to ImpactHub 🎉', html });
}

async function sendApplicationStatusEmail(user, project, status) {
  const isApproved = status === 'approved';
  const html = baseWrapper(
    'Application Update',
    `<h2 style="color:#111827;">Application ${isApproved ? 'Approved ✅' : 'Rejected ❌'}</h2>
     <p style="color:#4b5563;line-height:1.6;">
       Hi ${user.name}, your application to join <b>${project.title}</b> has been
       <b style="color:${isApproved ? '#16a34a' : '#dc2626'};">${status}</b>.
     </p>`
  );
  return sendEmail({ to: user.email, subject: `Application ${isApproved ? 'Approved' : 'Rejected'} — ${project.title}`, html });
}

async function sendTaskAssignedEmail(user, task, project) {
  const html = baseWrapper(
    'New Task Assigned',
    `<h2 style="color:#111827;">New Task Assigned 📋</h2>
     <p style="color:#4b5563;line-height:1.6;">
       Hi ${user.name}, you have been assigned a new task <b>${task.title}</b> on project
       <b>${project.title}</b>. Priority: <b>${task.priority}</b>. Deadline: <b>${new Date(task.deadline).toDateString()}</b>.
     </p>`
  );
  return sendEmail({ to: user.email, subject: `New Task Assigned — ${task.title}`, html });
}

// Automated certificate generator rendered as an HTML email body (printable to PDF client-side)
async function sendCertificateEmail(user, project, stats = {}) {
  const certificateHtml = `
  <div style="border:8px solid #0f766e;padding:40px;text-align:center;font-family:Georgia,serif;background:#fffef9;">
    <p style="letter-spacing:3px;color:#0f766e;font-size:13px;">CERTIFICATE OF APPRECIATION</p>
    <h1 style="font-size:30px;color:#111827;margin:16px 0;">${user.name}</h1>
    <p style="color:#4b5563;font-size:15px;">has successfully contributed as a volunteer on</p>
    <h2 style="color:#0f766e;margin:8px 0;">${project.title}</h2>
    <p style="color:#4b5563;font-size:14px;margin-top:16px;">
      Tasks Completed: <b>${stats.tasksCompleted || 0}</b> &nbsp;|&nbsp;
      Hours Contributed: <b>${stats.hoursContributed || 0}</b> &nbsp;|&nbsp;
      Impact Score: <b>${stats.impactScore || 0}</b>
    </p>
    <p style="margin-top:32px;color:#9ca3af;font-size:12px;">Issued by ImpactHub — Saylani Community Impact Platform</p>
    <p style="color:#9ca3af;font-size:12px;">${new Date().toDateString()}</p>
  </div>`;

  const html = baseWrapper('Your Certificate of Appreciation', certificateHtml);
  return sendEmail({ to: user.email, subject: `Your Certificate — ${project.title}`, html });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationStatusEmail,
  sendTaskAssignedEmail,
  sendCertificateEmail,
};
