import { Router } from 'express';
import {
  handleVisitorMessage,
  requestCallback,
  getVisitorConversation,
  getAdminConversations,
  getAdminConversationById,
  adminReplyToVisitor,
  updateCallbackStatus,
  updateLeadInfo,
  deleteConversation,
} from '../controllers/chatbotController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Public routes for website visitors
router.post('/message', handleVisitorMessage);
router.post('/callback', requestCallback);
router.get('/conversation/:sessionId', getVisitorConversation);

// Super Admin protected routes
router.get('/admin/conversations', authenticateJWT, requireRoles(['SUPER_ADMIN']), getAdminConversations);
router.get('/admin/conversation/:id', authenticateJWT, requireRoles(['SUPER_ADMIN']), getAdminConversationById);
router.post('/admin/reply', authenticateJWT, requireRoles(['SUPER_ADMIN']), adminReplyToVisitor);
router.put('/admin/callback-status', authenticateJWT, requireRoles(['SUPER_ADMIN']), updateCallbackStatus);
router.put('/admin/update-lead', authenticateJWT, requireRoles(['SUPER_ADMIN']), updateLeadInfo);
router.delete('/admin/conversation/:id', authenticateJWT, requireRoles(['SUPER_ADMIN']), deleteConversation);

export default router;
