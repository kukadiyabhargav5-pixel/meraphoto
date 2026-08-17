import { Router } from 'express';
import { createContactSubmission, getContactSubmissions, updateContactStatus, replyToContactSubmission } from '../controllers/contactController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Public route to submit a contact form
router.post('/', createContactSubmission);

// Admin routes
router.get('/', authenticateJWT, requireRoles(['SUPER_ADMIN']), getContactSubmissions);
router.put('/:id/status', authenticateJWT, requireRoles(['SUPER_ADMIN']), updateContactStatus);
router.post('/:id/reply', authenticateJWT, requireRoles(['SUPER_ADMIN']), replyToContactSubmission);

export default router;
