import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Customer from '../models/Customer';
import Team from '../models/Team';
import Booking from '../models/Booking';
import Quotation from '../models/Quotation';
import Bill from '../models/Bill';
import ShootLog from '../models/ShootLog';
import { Portfolio } from '../models/Portfolio';
import { EventCover } from '../models/EventCover';
import { Event } from '../models/Event';
import { Media } from '../models/Media';
import { Studio } from '../models/Studio';
import GalleryVisitor from '../models/GalleryVisitor';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';
import { uploadFile } from '../services/StorageService';

const router = express.Router();

// Apply auth middleware to ALL dashboard routes
router.use(authenticateJWT);

// --- File Upload Setup (local disk) ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, 'dashboard');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// --- REAL-TIME STATS ---
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find the studio for this user
    const studio = await Studio.findOne({ ownerId: userId });
    if (!studio) {
      return res.json({ events: 0, photos: 0, customers: 0 });
    }

    const studioId = studio._id;

    // Parallel count queries for performance
    const [eventsCount, mediaCount, visitorsCount, teamCount, customersCount] = await Promise.all([
      Event.countDocuments({ studioId }),
      Media.countDocuments({ studioId }), // Count all media (photos and videos)
      GalleryVisitor.countDocuments({ studioId }),
      Team.countDocuments({ studioId }),
      Customer.countDocuments({ studioId }), // Fixed to only count this studio's customers
    ]);

    return res.json({
      events: eventsCount,
      media: mediaCount,
      visitors: visitorsCount,
      teamMembers: teamCount,
      customers: customersCount,
      studioName: studio.name,
      subscriptionPlan: studio.subscriptionPlan,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- CUSTOMERS ---
router.get('/customers', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await Customer.find({ studioId: studio._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/customers', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    const customer = new Customer({ ...req.body, studioId: studio._id });
    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/customers/:id', async (req: AuthRequest, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/customers/:id', async (req: AuthRequest, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- TEAM ---
router.get('/team', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await Team.find({ studioId: studio._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/team', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    
    // Check for duplicates
    const existingMember = await Team.findOne({ studioId: studio._id, email: req.body.email });
    if (existingMember) {
      return res.status(400).json({ error: 'Team member with this email already exists' });
    }

    const member = new Team({ ...req.body, studioId: studio._id });
    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/team/:id', async (req: AuthRequest, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/team/:id', async (req: AuthRequest, res) => {
  try {
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- BOOKINGS ---
router.get('/bookings', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await Booking.find({ studioId: studio._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/bookings', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    const booking = new Booking({ ...req.body, studioId: studio._id });
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/bookings/:id', async (req: AuthRequest, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- QUOTATIONS ---
router.get('/quotations', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await Quotation.find({ studioId: studio._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/quotations', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    const quotation = new Quotation({ ...req.body, studioId: studio._id });
    await quotation.save();
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/quotations/:id', async (req: AuthRequest, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/quotations/:id', async (req: AuthRequest, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- BILLS ---
router.get('/bills', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await Bill.find({ studioId: studio._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/bills', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    const bill = new Bill({ ...req.body, studioId: studio._id });
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/bills/:id', async (req: AuthRequest, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/bills/:id', async (req: AuthRequest, res) => {
  try {
    const updated = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- SHOOTS (Calendar) ---
router.get('/shoots', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.json([]);
    const data = await ShootLog.find({ studioId: studio._id }).sort({ date: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/shoots', async (req: AuthRequest, res) => {
  try {
    const studio = await Studio.findOne({ ownerId: req.user!._id });
    if (!studio) return res.status(404).json({ error: 'No studio profile found. Please set up your studio first.' });
    const shoot = new ShootLog({ ...req.body, studioId: studio._id });
    await shoot.save();
    res.json(shoot);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/shoots/:id', async (req: AuthRequest, res) => {
  try {
    await ShootLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================
// EVENT COVER ENDPOINTS
// ===========================

// Upload generic asset (e.g., watermark logo)
router.post('/upload-asset', uploadMemory.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const { url } = await uploadFile(req.file.buffer, `events/assets/watermarks`);
    return res.status(201).json({ success: true, url });
  } catch (error: any) {
    console.error('Asset upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Upload event cover image
router.post('/event-cover', uploadMiddleware.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = `/uploads/dashboard/${req.file.filename}`;
    
    const eventCover = await EventCover.create({
      userId: req.user!._id,
      image: imageUrl,
    });

    return res.status(201).json({ success: true, eventCover });
  } catch (error: any) {
    console.error('Event cover upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Get user's event covers
router.get('/event-cover', async (req: AuthRequest, res) => {
  try {
    const covers = await EventCover.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    return res.json({ success: true, covers });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch event covers' });
  }
});

// Delete event cover
router.delete('/event-cover/:id', async (req: AuthRequest, res) => {
  try {
    const cover = await EventCover.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!cover) {
      return res.status(404).json({ error: 'Event cover not found' });
    }
    // Try to delete the file
    const filePath = path.join(process.cwd(), cover.image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.json({ success: true, message: 'Event cover deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

// ===========================
// PORTFOLIO ENDPOINTS
// ===========================

// Create portfolio entry
router.post('/portfolio', uploadMiddleware.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const imageUrl = `/uploads/dashboard/${req.file.filename}`;
    
    const portfolio = await Portfolio.create({
      userId: req.user!._id,
      image: imageUrl,
      title,
      description: description || '',
    });

    return res.status(201).json({ success: true, portfolio });
  } catch (error: any) {
    console.error('Portfolio create error:', error);
    return res.status(500).json({ error: error.message || 'Creation failed' });
  }
});

// Get user's portfolios
router.get('/portfolio', async (req: AuthRequest, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    return res.json({ success: true, portfolios });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch portfolios' });
  }
});

// Free direct upgrade endpoint requested by user
router.post('/free-upgrade', async (req: AuthRequest, res: express.Response) => {
  try {
    const { plan } = req.body;
    console.log('[free-upgrade] Request received:', { plan, userId: req.user?._id, role: req.user?.role });
    if (!plan) return res.status(400).json({ error: 'Plan is required' });

    let studio = await Studio.findOne({ ownerId: req.user?._id });
    
    if (!studio) {
      console.log('[free-upgrade] No studio found, auto-creating one...');
      // Auto-create a studio (same logic as /studio/me)
      const { User: UserModel } = require('../models');
      const user = await UserModel.findById(req.user?._id);
      const cleanName = (user ? user.name : 'Mara') + ' Studio';
      
      studio = await Studio.create({
        name: cleanName,
        ownerId: req.user?._id,
        subscriptionPlan: plan,
        subscriptionStatus: 'ACTIVE',
      });
      
      // Upgrade role if needed
      if (user && user.role === 'CLIENT') {
        user.role = 'STUDIO_OWNER';
        await user.save();
      }
      
      console.log('[free-upgrade] Auto-created studio:', studio.name);
      return res.json({ message: 'Free upgrade successful (new studio created)', studio });
    }

    const startDate = new Date();
    const oneYearFromNow = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    studio.subscriptionPlan = plan;
    studio.subscriptionStatus = 'ACTIVE';
    studio.subscriptionStartDate = startDate;
    studio.subscriptionExpiresAt = oneYearFromNow;
    await studio.save();

    console.log('[free-upgrade] Studio upgraded:', studio.name, '->', plan);
    return res.json({ message: 'Free upgrade successful', studio });
  } catch (err: any) {
    console.error('[free-upgrade] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Update portfolio entry
router.put('/portfolio/:id', async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { ...(title && { title }), ...(description !== undefined && { description }) },
      { new: true }
    );
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    return res.json({ success: true, portfolio });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Update failed' });
  }
});

// Delete portfolio entry
router.delete('/portfolio/:id', async (req: AuthRequest, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    // Try to delete the file
    const filePath = path.join(process.cwd(), portfolio.image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.json({ success: true, message: 'Portfolio deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

export default router;
