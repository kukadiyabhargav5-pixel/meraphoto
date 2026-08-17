import { Request, Response } from 'express';
import ContactSubmission from '../models/ContactSubmission';
import { sendAdminNotificationEmail, sendEmail } from '../services/EmailService';

/**
 * Create a new contact submission from public website
 */
export const createContactSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    const contact = new ContactSubmission({
      name,
      email,
      phone,
      message,
    });

    await contact.save();

    // Send email to admin
    const subject = `New Contact Inquiry from ${name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #6366f1;">New Contact Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin-top: 10px; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

    try {
      await sendAdminNotificationEmail(subject, html);
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // We still return success since the inquiry was saved
    }

    res.status(201).json({ success: true, message: 'Your message has been sent successfully.' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit contact form.' });
  }
};

/**
 * Get all contact submissions (Admin)
 */
export const getContactSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await ContactSubmission.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Fetch contact submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact submissions.' });
  }
};

/**
 * Update contact submission status (Admin)
 */
export const updateContactStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status.' });
      return;
    }

    const contact = await ContactSubmission.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found.' });
      return;
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update contact status.' });
  }
};

/**
 * Reply to contact submission and delete it (Admin)
 */
export const replyToContactSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage) {
      res.status(400).json({ success: false, message: 'Reply message is required.' });
      return;
    }

    const contact = await ContactSubmission.findById(id);
    
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found.' });
      return;
    }

    // Send email to the contact
    const subject = `Reply from Mara Photo regarding your inquiry`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #6366f1;">Mara Photo Support</h2>
        <p>Dear ${contact.name},</p>
        <p>Thank you for reaching out to us. Here is our reply to your recent inquiry:</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px;">
          <p style="margin: 0; white-space: pre-wrap;">${replyMessage}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Your original message:</p>
        <p style="color: #6b7280; font-size: 12px; font-style: italic;">"${contact.message}"</p>
      </div>
    `;

    try {
      await sendEmail(contact.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send reply email:', emailError);
      res.status(500).json({ success: false, message: 'Failed to send email to the user.' });
      return;
    }

    // Delete the contact submission after successful reply
    await ContactSubmission.findByIdAndDelete(id);

    res.json({ success: true, message: 'Reply sent successfully and query removed.' });
  } catch (error) {
    console.error('Reply to contact error:', error);
    res.status(500).json({ success: false, message: 'Failed to process reply.' });
  }
};
