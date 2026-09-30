import { Router } from 'express';
import { searchBySelfie, chatWithAI } from '../controllers/aiController';
import { upload } from '../middlewares/upload';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Upload a selfie and search for matching faces within an event
router.post('/search/:eventId', upload.single('selfie'), searchBySelfie);

// Chatbot interactions
router.post('/chat', authenticateJWT, chatWithAI);

export default router;
