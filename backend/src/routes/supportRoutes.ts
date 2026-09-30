import { Router } from 'express';
import { createTicket, getMyTickets, replyToTicket, updateTicketStatus, getAllTickets } from '../controllers/supportController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

router.post('/ticket', authenticateJWT, createTicket);
router.get('/tickets', authenticateJWT, getMyTickets);
router.post('/ticket/:ticketId/reply', authenticateJWT, replyToTicket);

// Admin-only updates
router.get('/tickets/all', authenticateJWT, requireRoles(['SUPER_ADMIN']), getAllTickets);
router.put('/ticket/:ticketId/status', authenticateJWT, requireRoles(['SUPER_ADMIN']), updateTicketStatus);

export default router;
