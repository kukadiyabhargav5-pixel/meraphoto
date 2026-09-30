import { Router } from 'express';
import { 
  getPaymentConfig,
  createOrderSession,
  verifyPayment,
  getOrderById,
  getUserOrders,
  createBillingSession, 
  cancelMySubscription, 
  handleRazorpayWebhook 
} from '../controllers/paymentController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Public / Auth Payment Config
router.get('/config', getPaymentConfig);

// E-Commerce & Plan Payment Flow
router.post('/create-order', createOrderSession);
router.post('/verify', verifyPayment);
router.get('/order/:id', getOrderById);
router.get('/my-orders', authenticateJWT, getUserOrders);

// Legacy studio plan checkout endpoints
router.post('/checkout', authenticateJWT, createBillingSession);
router.post('/cancel', authenticateJWT, cancelMySubscription);

// Webhook endpoint (Public, signature-verified inside controller)
router.post('/webhook', handleRazorpayWebhook);

export default router;
