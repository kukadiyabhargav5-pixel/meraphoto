import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Studio } from '../models';
import { sendOTPEmail, sendWelcomeEmail, sendAdminNotificationEmail } from '../services/EmailService';
import { AuthRequest } from '../middlewares/auth';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'default_super_secret_jwt_access_token_key_1234';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_super_secret_jwt_refresh_token_key_5678';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

/**
 * Register a new Studio Owner and auto-initialize their Studio profile
 */
export const registerStudioOwner = async (req: Request, res: Response) => {
  const { name, email, password, phone, studioName, websiteLink, logoUrl, instagramUrl, facebookUrl } = req.body;

  try {
    if (!name || !email || !password || !phone || !studioName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.' });
    }

    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must start with a Capital letter, and contain at least 1 number, 1 special character, and small letters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'STUDIO_OWNER',
    });

    // Create studio
    const newStudio = await Studio.create({
      name: studioName,
      ownerId: newUser._id,
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'FREE',
      customDomain: websiteLink || undefined,
      logoUrl: logoUrl || undefined,
      instagramUrl: instagramUrl || undefined,
      facebookUrl: facebookUrl || undefined,
    });

    const tokens = generateTokens(newUser._id.toString(), newUser.role);
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save();

    // Send Welcome Email asynchronously (don't block the response)
    sendWelcomeEmail(newUser.email, newUser.name, true).catch(err => console.error("Welcome Email Failed:", err));

    return res.status(201).json({
      message: 'Studio registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone },
      studio: { id: newStudio._id, name: newStudio.name, logoUrl: newStudio.logoUrl, customDomain: newStudio.customDomain },
      ...tokens,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Normal email/password login
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // SUPER_ADMIN interception
    if (email.toLowerCase() === 'maraphoto303@gmail.com' && password === 'maraphoto@2005') {
      let adminUser = await User.findOne({ email: 'maraphoto303@gmail.com' });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        adminUser = await User.create({
          name: 'Super Admin',
          email: 'maraphoto303@gmail.com',
          passwordHash,
          role: 'SUPER_ADMIN'
        });
      } else if (adminUser.role !== 'SUPER_ADMIN') {
        adminUser.role = 'SUPER_ADMIN';
      }
      
      const tokens = generateTokens(adminUser._id.toString(), adminUser.role);
      adminUser.refreshToken = tokens.refreshToken;
      await adminUser.save();

      return res.json({
        user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
        studio: null,
        ...tokens,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Check if user is associated with any studio
    let studio = null;
    if (user.role === 'STUDIO_OWNER') {
      studio = await Studio.findOne({ ownerId: user._id });
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      studio: studio ? { 
        id: studio._id, 
        name: studio.name, 
        subscriptionPlan: studio.subscriptionPlan || 'PREMIUM',
        subscriptionStatus: studio.subscriptionStatus || 'ACTIVE',
        subscriptionStartDate: studio.subscriptionStartDate,
        subscriptionExpiresAt: studio.subscriptionExpiresAt,
        logoUrl: studio.logoUrl,
        customDomain: studio.customDomain,
        branding: studio.branding
      } : null,
      ...tokens,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Google Login/Signup
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || 'User';

    let user = await User.findOne({ email });

    // If user doesn't exist, create them as STUDIO_OWNER (or just user)
    // For our app, we usually need studio details for registration, but for Google Login we can
    // just create the user, and if they don't have a studio, they can be prompted to create one later.
    // Or we create a placeholder studio. We'll create a placeholder studio.
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await User.create({
        name,
        email,
        role: 'STUDIO_OWNER',
        // Password is not needed for google auth, but we might want a placeholder or optional password
      });
    }

    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    let studio = null;
    if (user.role === 'STUDIO_OWNER') {
      studio = await Studio.findOne({ ownerId: user._id });
      
      // If new user, create a placeholder studio
      if (!studio) {
        studio = await Studio.create({
          name: name + "'s Studio",
          ownerId: user._id,
          subscriptionPlan: 'BASIC',
          subscriptionStatus: 'FREE',
        });
      }
    }

    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name, true).catch(err => console.error("Welcome Email Failed:", err));
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      studio: studio ? { 
        id: studio._id, 
        name: studio.name, 
        subscriptionPlan: studio.subscriptionPlan || 'PREMIUM',
        subscriptionStatus: studio.subscriptionStatus || 'ACTIVE',
        subscriptionStartDate: studio.subscriptionStartDate,
        subscriptionExpiresAt: studio.subscriptionExpiresAt,
        logoUrl: studio.logoUrl,
        customDomain: studio.customDomain,
        branding: studio.branding
      } : null,
      ...tokens,
    });
  } catch (err: any) {
    console.error('Google Login Error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
};

/**
 * Get current authenticated user
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let studio = null;
    if (user.role === 'STUDIO_OWNER') {
      studio = await Studio.findOne({ ownerId: user._id });
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      studio: studio ? { 
        id: studio._id, 
        name: studio.name, 
        subscriptionPlan: studio.subscriptionPlan || 'PREMIUM',
        subscriptionStatus: studio.subscriptionStatus || 'ACTIVE',
        subscriptionStartDate: studio.subscriptionStartDate,
        subscriptionExpiresAt: studio.subscriptionExpiresAt,
        logoUrl: studio.logoUrl,
        customDomain: studio.customDomain,
        branding: studio.branding
      } : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Logout - clear refresh token
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * OTP Request (generates and emails verification code)
 */
export const requestOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Auto-register client users on OTP request
      user = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        role: 'CLIENT',
      });
    }

    // Generate 6 digit numeric code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    user.otp = { code: otpCode, expiresAt };
    await user.save();

    // Send via email service
    await sendOTPEmail(user.email, otpCode);

    return res.json({ message: 'Verification OTP sent to your email' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * OTP Verification (validates and issues session tokens)
 */
export const verifyOTP = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otp || user.otp.code !== code) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(401).json({ error: 'Verification code has expired' });
    }

    // Clear OTP on successful validation
    user.otp = undefined;
    
    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name || 'Guest', false).catch(err => console.error("Welcome Email Failed:", err));

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      ...tokens,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.json({ ...tokens });
  } catch (err: any) {
    return res.status(401).json({ error: 'Expired or invalid refresh token' });
  }
};

/**
 * Request OTP for Forgot Password
 */
export const forgotPasswordRequestOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }

    // Generate 6 digit numeric code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    user.otp = { code: otpCode, expiresAt };
    await user.save();

    // Send via email service
    await sendOTPEmail(user.email, otpCode);

    return res.json({ message: 'Password reset OTP sent to your email' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Verify OTP before allowing password reset
 */
export const verifyResetOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otp || user.otp.code !== otp) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(401).json({ error: 'Verification code has expired' });
    }

    return res.json({ message: 'OTP verified successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Reset Password with OTP
 */
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must start with a Capital letter, and contain at least 1 number, 1 special character, and small letters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otp || user.otp.code !== otp) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(401).json({ error: 'Verification code has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user and clear OTP
    user.passwordHash = passwordHash;
    user.otp = undefined;
    
    // Invalidate refresh tokens (log out from all devices)
    user.refreshToken = undefined;
    await user.save();

    return res.json({ message: 'Password has been successfully reset.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Check if email is already registered (for live signup validation)
 */
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.query;
  try {
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    const existing = await User.findOne({ email: (email as string).toLowerCase() });
    return res.json({ exists: !!existing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
