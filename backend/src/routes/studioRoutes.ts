import { Router } from 'express';
import { getMyStudio, updateMyStudio, getStudioCredits, updateStudioPlan } from '../controllers/studioController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticateJWT, getMyStudio);
router.get('/credits', authenticateJWT, getStudioCredits);
router.put('/me', authenticateJWT, updateMyStudio);
router.post('/plan', authenticateJWT, updateStudioPlan);

export default router;
