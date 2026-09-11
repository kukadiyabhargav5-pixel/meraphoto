import { Router } from 'express';
import { createEvent, getMyEvents, getEventByCode, verifyEventPassword, getEventQRCode, updateEvent, requestEventOtp, verifyEventOtp, deleteEvent, updatePortfolioStatus } from '../controllers/eventController';
import { faceSearch } from '../controllers/searchController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max selfie size
});

const router = Router();

// Studio routes
router.post('/', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), createEvent);
router.get('/my', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), getMyEvents);
router.put('/:eventId', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), updateEvent);
router.patch('/:eventId/portfolio-status', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), updatePortfolioStatus);
router.delete('/:eventId', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), deleteEvent);

// Public / Guest gallery routes
router.get('/code/:code', getEventByCode);
router.post('/code/:code/verify-password', verifyEventPassword);
router.post('/code/:code/request-otp', requestEventOtp);
router.post('/code/:code/verify-otp', verifyEventOtp);
router.get('/code/:code/qr', getEventQRCode);

// Face search route — accepts multiple selfie frames for multi-query matching
router.post('/:eventId/face-search', upload.array('file', 5), faceSearch);

export default router;
