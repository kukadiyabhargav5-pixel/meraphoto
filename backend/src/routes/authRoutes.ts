import { Router } from 'express';
import { registerStudioOwner, login, requestOTP, verifyOTP, refreshToken, forgotPasswordRequestOTP, verifyResetOTP, resetPassword, getMe, logout, checkEmail, googleLogin } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/register', registerStudioOwner);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authenticateJWT, getMe);
router.post('/logout', authenticateJWT, logout);
router.get('/check-email', checkEmail);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password-otp', forgotPasswordRequestOTP);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

export default router;
