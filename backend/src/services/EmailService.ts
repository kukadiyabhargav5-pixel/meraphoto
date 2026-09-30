import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

const fromEmail = process.env.SMTP_FROM || 'noreply@maraphoto.com';

/**
 * Sends a generic email
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<any> => {
  // If SMTP is mock, print in console
  if (process.env.SMTP_USER === 'mock_user' || !process.env.SMTP_HOST) {
    console.log(`\n--- [MOCK EMAIL NOTIFICATION] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 300)}...`);
    console.log(`----------------------------------\n`);
    return { mock: true, sent: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Mara Photo" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    throw new Error(`Email Send Failure: ${error.message}`);
  }
};

/**
 * Sends an OTP email for login verification
 */
export const sendOTPEmail = async (to: string, code: string): Promise<any> => {
  const subject = 'Mara Photo - Your OTP Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center;">Mara Photo Authentication</h2>
      <p>Hello,</p>
      <p>You requested a verification code to access your account or event. Please use the One-Time Password (OTP) below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 6px; color: #1f2937;">
          ${code}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Mara Photo © 2026 - Find Every Memory With AI</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

/**
 * Sends an invite to clients for newly created events
 */
export const sendEventInviteEmail = async (
  to: string,
  clientName: string,
  eventName: string,
  galleryLink: string,
  accessType: string,
  password?: string
): Promise<any> => {
  const subject = `Invited to View Event: ${eventName}`;
  const accessDetails = accessType === 'PASSWORD' 
    ? `<p><strong>Access Type:</strong> Password Protected<br/><strong>Password:</strong> ${password}</p>`
    : `<p><strong>Access Type:</strong> ${accessType}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center;">You have been invited!</h2>
      <p>Dear ${clientName},</p>
      <p>A photography studio has uploaded photos/videos for the event <strong>${eventName}</strong> on Mara Photo.</p>
      ${accessDetails}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${galleryLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
          View Gallery
        </a>
      </div>
      <p>You can instantly find all your photos by uploading a selfie once inside the gallery.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Mara Photo © 2026 - Find Every Memory With AI</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

/**
 * Sends a welcome email for newly registered studios or guests
 */
export const sendWelcomeEmail = async (to: string, name: string = 'User', isStudio: boolean = false): Promise<any> => {
  const subject = isStudio ? 'Welcome to Mara Photo Studio! 📸' : 'Welcome to Mara Photo - Your Visual Workspace';
  const roleText = isStudio 
    ? `
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Thank you for registering your photography studio with <strong>Mara Photo</strong>! We are absolutely thrilled to have you on board.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">With your new Studio Account, you now have access to a powerful suite of tools designed to revolutionize how you deliver photos to your clients. Here is what you can do right now:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e293b; margin-top: 0;">🚀 Getting Started:</h3>
        <ol style="color: #4b5563; line-height: 1.8; margin-bottom: 0;">
          <li><strong>Create an Event:</strong> Set up your first wedding, corporate event, or birthday party.</li>
          <li><strong>Upload Photos:</strong> Drag and drop thousands of photos securely to our high-speed cloud.</li>
          <li><strong>Let AI do the Magic:</strong> Our advanced facial recognition engine will automatically index every face.</li>
          <li><strong>Share with Clients:</strong> Send a magical link or QR code to your clients. They just upload one selfie to get all their photos instantly!</li>
        </ol>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Say goodbye to the old days of sending Google Drive links and forcing clients to scroll through thousands of photos to find themselves. You are now officially a part of the next generation of photography!</p>
    `
    : `
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Welcome! You have successfully accessed your <strong>Mara Photo</strong> gallery.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">You can now find all your beautiful memories instantly by simply uploading a single selfie. Our secure AI will scan the event and fetch every photo you are in.</p>
    `;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px; letter-spacing: -0.5px;">MARA PHOTO</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Next-Gen AI Photo Delivery</p>
      </div>

      <h2 style="color: #1e293b; font-size: 24px;">Welcome, ${name}! 🎉</h2>
      
      ${roleText}

      <div style="text-align: center; margin: 40px 0;">
        <a href="\${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Access Your Dashboard
        </a>
      </div>

      <p style="color: #64748b; font-size: 15px; line-height: 1.6;">If you need any help getting started, our support team is always here for you. Just reply directly to this email!</p>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      
      <p style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
        <strong>Mara Photo Technologies</strong><br/>
        Find Every Memory With AI<br/>
        © 2026 All Rights Reserved
      </p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

/**
 * Sends a notification to the admin email
 */
export const sendAdminNotificationEmail = async (subject: string, html: string): Promise<any> => {
  const adminEmail = process.env.SMTP_FROM || 'maraphoto303@gmail.com';
  return sendEmail(adminEmail, subject, html);
};
