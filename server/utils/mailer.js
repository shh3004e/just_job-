const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If credentials are mock or missing, return a dummy transporter
  if (!user || user.includes('dummy') || !pass || pass.includes('dummy')) {
    console.log('--- Nodemailer: Using Mock Console Transporter ---');
    return {
      sendMail: async (options) => {
        console.log('\n==================================================');
        console.log(`[MOCK EMAIL SENT]`);
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.text || options.html}`);
        console.log('==================================================\n');
        return { messageId: 'mock-id-' + Math.random() };
      }
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_EMAIL_NAME || 'JJ Just Job'}" <${process.env.FROM_EMAIL || 'no-reply@jjjustjob.com'}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email dispatched successfully. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed. Displaying fallback log:');
    console.log('\n==================================================');
    console.log(`[FALLBACK EMAIL LOG]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Plain Text):\n${text || html.replace(/<[^>]*>/g, '')}`);
    console.log('==================================================\n');
    return { messageId: 'fallback-id' };
  }
};

// Seeker application confirmation email
const sendApplicationConfirmation = async (seekerEmail, seekerName, jobTitle) => {
  const subject = `Application Received - ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1d2226; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0a66c2 0%, #008080 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">JJ Just Job</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Niche Portal for Graphic & UI/UX Freshers</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #0a66c2;">Hi ${seekerName},</h2>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position on JJ Just Job!</p>
        <p>Your full profile, including your resume and work samples, has been shared with the hiring manager.</p>
        <p>The HR representative will review your details shortly. You will receive an email as soon as they make a decision on your application.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #f3f2f0; border-radius: 6px; border-left: 4px solid #008080;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px;">What happens next?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>HR reviews your resume & portfolio images.</li>
            <li>If accepted, you will receive an official onboarding or next-steps email.</li>
            <li>If rejected, you will be notified, and the job listing will remain open for others.</li>
          </ul>
        </div>
        <p>Best of luck with your application!</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #8c8c8c; text-align: center; margin: 0;">Developed by Suryansh (Founder) | JJ Just Job</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: seekerEmail,
    subject,
    html,
    text: `Hi ${seekerName},\n\nThank you for applying for the ${jobTitle} position on JJ Just Job. Your profile has been shared with the HR. You will be notified of any updates.\n\nBest of luck!\n\nDeveloped by Suryansh (Founder)`
  });
};

// Recruiter vacancy full email (send multiple times simulating repeat alert)
const sendVacancyFullAlert = async (hrEmail, jobTitle, appCount) => {
  const subject = `[ALERT] Vacancy Full - Action Required: ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1d2226; max-width: 600px; margin: 0 auto; border: 1px solid #ffccd5; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">VACANCY FULL</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">JJ Just Job - Recruiter Portal</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #d32f2f;">Dear Hiring Manager,</h2>
        <p>This is an automated notification that your job posting for <strong>${jobTitle}</strong> has received applications matching your vacancy limit of <strong>${appCount}</strong>.</p>
        <p style="color: #d32f2f; font-weight: bold;">We have automatically STOPPED accepting new applications for this posting.</p>
        <p>Please log in to your dashboard immediately to review the candidates and take action (Accept / Reject).</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107; color: #856404;">
          <strong>Action Required:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li>Accepting a candidate will officially fill the vacancy and automatically close the listing permanently.</li>
            <li>Rejecting a candidate will send them a polite email and reopen the vacancy slots, letting others apply.</li>
          </ul>
        </div>
        <p>Thank you for using JJ Just Job!</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #8c8c8c; text-align: center; margin: 0;">Developed by Suryansh (Founder) | JJ Just Job</p>
      </div>
    </div>
  `;

  // Send primary email
  await sendEmail({
    to: hrEmail,
    subject,
    html,
    text: `Dear HR,\n\nYour job posting for ${jobTitle} has hit its application vacancy limit of ${appCount}. We have stopped accepting new candidates. Please review the candidates on your dashboard.\n\nDeveloped by Suryansh (Founder)`
  });

  // Simulate repeated notifications by scheduling additional emails
  // Since we want to send "repeated notifications until reviewed", let's send 2 follow-ups
  // spaced out by small intervals (e.g. 30 seconds and 60 seconds in the background)
  setTimeout(async () => {
    console.log(`[REPEATED ALERT 1] Sending repeat vacancy alert to HR: ${hrEmail}`);
    await sendEmail({
      to: hrEmail,
      subject: `[REMINDER 1] Vacancy Full - Action Required: ${jobTitle}`,
      html: html.replace('VACANCY FULL', 'VACANCY FULL - REMINDER 1'),
      text: `Reminder: Your job posting for ${jobTitle} is full. Please review candidates.`
    });
  }, 15000); // 15 seconds for testing purposes

  setTimeout(async () => {
    console.log(`[REPEATED ALERT 2] Sending repeat vacancy alert to HR: ${hrEmail}`);
    await sendEmail({
      to: hrEmail,
      subject: `[REMINDER 2] Vacancy Full - Action Required: ${jobTitle}`,
      html: html.replace('VACANCY FULL', 'VACANCY FULL - REMINDER 2'),
      text: `Reminder 2: Your job posting for ${jobTitle} is full. Please review candidates.`
    });
  }, 30000); // 30 seconds
};

// Seeker acceptance email
const sendAcceptanceEmail = async (seekerEmail, seekerName, jobTitle, hrEmail) => {
  const subject = `Congratulations! You have been accepted for ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1d2226; max-width: 600px; margin: 0 auto; border: 1px solid #c3e6cb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #10b981 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">CONGRATULATIONS!</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">JJ Just Job - Selection Confirmation</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #28a745;">Hi ${seekerName},</h2>
        <p>Excellent news! The hiring manager has reviewed your profile and work samples and has <strong>ACCEPTED</strong> your application for the <strong>${jobTitle}</strong> position.</p>
        <p>This is a huge milestone, and we are thrilled for you! The company will reach out to you directly with onboarding instructions and contract details.</p>
        <div style="margin: 24px 0; padding: 16px; background-color: #d4edda; border-radius: 6px; border-left: 4px solid #28a745; color: #155724;">
          <strong>Contact Information:</strong><br>
          For any immediate queries, you can reach out directly to the HR contact email at: <a href="mailto:${hrEmail}" style="color: #155724; font-weight: bold;">${hrEmail}</a>
        </div>
        <p>We wish you an outstanding start to your career!</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #8c8c8c; text-align: center; margin: 0;">Developed by Suryansh (Founder) | JJ Just Job</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: seekerEmail,
    subject,
    html,
    text: `Congratulations ${seekerName}!\n\nYour application for ${jobTitle} has been accepted. The HR will contact you at ${hrEmail} to proceed.\n\nBest wishes!\n\nDeveloped by Suryansh (Founder)`
  });
};

// Seeker rejection email
const sendRejectionEmail = async (seekerEmail, seekerName, jobTitle) => {
  const subject = `Update on your application for ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1d2226; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1d2226 0%, #5c636a 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">APPLICATION UPDATE</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">JJ Just Job - Feedback</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <h2 style="margin-top: 0; color: #1d2226;">Hi ${seekerName},</h2>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to share your resume and work samples with us.</p>
        <p>Unfortunately, after careful review, the hiring team has decided to proceed with other candidates whose portfolios align more closely with their current project requirements.</p>
        <p>We receive many applications, and making a selection is always difficult. Please do not be discouraged; your profile has been updated in our portal, and you are welcome to apply to other open roles that match your skill set.</p>
        <p>We wish you all the best in your job search and future design endeavors!</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #8c8c8c; text-align: center; margin: 0;">Developed by Suryansh (Founder) | JJ Just Job</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: seekerEmail,
    subject,
    html,
    text: `Hi ${seekerName},\n\nThank you for applying for the ${jobTitle} position. Unfortunately, we decided to proceed with other candidates. We wish you the best in your job search.\n\nDeveloped by Suryansh (Founder)`
  });
};

module.exports = {
  sendApplicationConfirmation,
  sendVacancyFullAlert,
  sendAcceptanceEmail,
  sendRejectionEmail
};
