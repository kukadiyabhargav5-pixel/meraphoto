import { Router } from 'express';
import { 
  createTicket, 
  getStudioTickets, 
  replyToTicket,
  updateTicketStatus 
} from '../controllers/clientTicketController';

const router = Router();

// Customer creating a new ticket (No auth required for this endpoint initially, or protect it with simple API keys if needed)
router.post('/', createTicket);

// Studio fetching tickets for their dashboard
router.get('/studio/:studioId', getStudioTickets);

// Studio replying to a ticket
router.post('/:id/reply', replyToTicket);

// Studio updating ticket status (e.g. marking as RESOLVED)
router.patch('/:id/status', updateTicketStatus);

export default router;
