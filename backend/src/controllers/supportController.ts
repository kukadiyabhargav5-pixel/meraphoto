import { Response } from 'express';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { SupportTicket } from '../models';

import { sendAdminNotificationEmail, sendEmail } from '../services/EmailService';

/**
 * Creates a support ticket
 */
export const createTicket = async (req: AuthRequest, res: Response) => {
  const { subject, message, phone, attachments } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!subject || !message || !phone) {
      return res.status(400).json({ error: 'Subject, message, and phone are required' });
    }

    const { Studio } = await import('../models');
    let studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) {
      studio = await Studio.create({
        name: `${req.user.name}'s Studio`,
        ownerId: req.user._id,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE'
      });
    }

    const newTicket = await SupportTicket.create({
      studioId: studio._id,
      name: req.user.name,
      email: req.user.email,
      phone,
      subject,
      status: 'OPEN',
      messages: [
        {
          sender: 'STUDIO',
          message,
          attachments: attachments || [],
          timestamp: new Date(),
        },
      ],
    });

    // Notify Admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #6366f1;">New Studio Query</h2>
        <p><strong>Studio:</strong> ${req.user.name}</p>
        <p><strong>Email:</strong> ${req.user.email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px;">
          <p style="margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        ${attachments && attachments.length > 0 ? `<p style="margin-top: 20px;"><strong>Attachments:</strong> ${attachments.length} file(s) attached.</p>` : ''}
      </div>
    `;
    await sendAdminNotificationEmail(`Studio Query: ${subject}`, adminHtml).catch(err => console.error("Email error:", err));

    return res.status(201).json({ message: 'Support ticket opened successfully', ticket: newTicket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * List support tickets opened by the studio owner
 */
export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { Studio } = await import('../models');
    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const tickets = await SupportTicket.find({ studioId: studio._id }).sort({ updatedAt: -1 });
    return res.json({ tickets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Adds a reply message to a support ticket
 */
export const replyToTicket = async (req: AuthRequest, res: Response) => {
  const { ticketId } = req.params;
  const { message } = req.body;

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!message) return res.status(400).json({ error: 'Message content is required' });

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    const senderRole = isSuperAdmin(req.user) ? 'ADMIN' : 'STUDIO';

    if (senderRole === 'ADMIN') {
      // Send email to studio
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #6366f1;">Mara Photo Support</h2>
          <p>Dear ${ticket.name},</p>
          <p>We have replied to your query regarding "<strong>${ticket.subject}</strong>":</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `;
      try {
        await sendEmail(ticket.email, `Reply: ${ticket.subject}`, html);
        
        // Push admin reply and save (do not delete so studio can view it)
        ticket.messages.push({
          sender: 'ADMIN',
          message,
          timestamp: new Date(),
        });
        ticket.status = 'RESOLVED';
        await ticket.save();

        return res.json({ message: 'Reply sent successfully', ticket });
      } catch (emailError) {
        console.error('Failed to send reply email:', emailError);
        return res.status(500).json({ error: 'Failed to send email to the studio.' });
      }
    } else {
      // Studio replying to their own ticket (if feature exists)
      ticket.messages.push({
        sender: senderRole,
        message,
        timestamp: new Date(),
      });
      ticket.status = 'OPEN';
      await ticket.save();
      return res.json({ message: 'Reply sent successfully', ticket });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * SUPER ADMIN endpoint to resolve support tickets
 */
export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  const { ticketId } = req.params;
  const { status } = req.body; // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    return res.json({ message: 'Ticket status updated successfully', ticket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all support tickets (Admin)
 */
export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const tickets = await SupportTicket.find({ status: { $ne: 'RESOLVED' } }).sort({ createdAt: -1 });
    return res.json({ success: true, tickets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
