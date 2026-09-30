import { Request, Response } from 'express';
import { ClientTicket } from '../models/ClientTicket';
import { Studio } from '../models/Studio';
import { sendEmail } from '../services/EmailService';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studioId, eventId, customerName, email, mobileNumber, complaint } = req.body;

    if (!studioId || !customerName || !email || !complaint) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const newTicket = new ClientTicket({
      studioId,
      eventId,
      customerName,
      email,
      mobileNumber,
      complaint,
      messages: [{ sender: 'CUSTOMER', message: complaint }]
    });

    await newTicket.save();

    // Fetch studio to get their email address from the owner
    const studio = await Studio.findById(studioId);
    if (studio) {
      const User = require('../models/User').default || require('../models/User');
      const owner = await User.findById(studio.ownerId);
      if (owner && owner.email) {
        const emailContent = `
          <h2>New Customer Ticket Received</h2>
          <p><strong>Customer Name:</strong> ${customerName}</p>
          <p><strong>Mobile:</strong> ${mobileNumber}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Complaint:</strong></p>
          <blockquote style="background: #f9f9f9; border-left: 5px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
            ${complaint}
          </blockquote>
          <p>You can reply to this ticket from your Studio Help Desk dashboard.</p>
        `;
        await sendEmail(owner.email, `New Ticket from ${customerName}`, emailContent);
      }
    }

    res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const getStudioTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studioId } = req.params;
    
    // Allow filtering by status if provided in query
    const { status } = req.query;
    const filter: any = { studioId };
    if (status) filter.status = status;

    const tickets = await ClientTicket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const replyToTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const ticket = await ClientTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    ticket.messages.push({
      sender: 'STUDIO',
      message,
      timestamp: new Date()
    });

    ticket.status = 'RESOLVED';

    await ticket.save();

    // Fetch studio for the sender name
    const studio = await Studio.findById(ticket.studioId);
    const studioName = studio ? studio.name : 'Studio Support';

    // If customer provided an email, send them a notification
    if (ticket.email) {
      const emailContent = `
        <h2>Reply to your Ticket</h2>
        <p>Hi ${ticket.customerName},</p>
        <p><strong>${studioName}</strong> has replied to your ticket regarding "${ticket.complaint.substring(0, 50)}...":</p>
        <blockquote style="background: #f9f9f9; border-left: 5px solid #c5a880; margin: 1.5em 10px; padding: 0.5em 10px;">
          ${message}
        </blockquote>
        <p>Thank you.</p>
      `;
      await sendEmail(ticket.email, `Reply from ${studioName} on your Ticket`, emailContent);
    }

    res.json({ message: 'Reply sent successfully', ticket });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ error: 'Failed to reply to ticket' });
  }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'RESOLVED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const ticket = await ClientTicket.findByIdAndUpdate(id, { status }, { new: true });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({ message: 'Ticket status updated', ticket });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
};
