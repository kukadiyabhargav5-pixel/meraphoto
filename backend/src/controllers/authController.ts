import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Studio } from '../models';
import { sendOTPEmail, sendWelcomeEmail, sendAdminNotificationEmail } from '../services/EmailService';
import { AuthRequest, isSuperAdmin } from '../middlewares/auth';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

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
  const { name, email, password, phone, studioName, websiteLink, logoUrl, instagramUrl, facebookUrl, whatsappUrl, whatsappNumber } = req.body;

  try {
    if (!name || !email || !password || !phone || !studioName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.' });
    }

    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#_\-~+=/.,><:;^]).{5,}$/;
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
      phone: cleanPhone,
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
      whatsappUrl: whatsappUrl || whatsappNumber || undefined,
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

      // Ensure Super Admin has an active studio with unlimited PREMIUM access
      let studio = await Studio.findOne({ ownerId: adminUser._id });
      if (!studio) {
        studio = await Studio.create({
          name: 'Super Admin Studio',
          ownerId: adminUser._id,
          subscriptionPlan: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date('2099-12-31')
        });
      } else if (!studio.subscriptionPlan) {
        studio.subscriptionPlan = 'PREMIUM';
        studio.subscriptionStatus = 'ACTIVE';
        studio.subscriptionExpiresAt = new Date('2099-12-31');
        await studio.save();
      }

      return res.json({
        user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
        studio: {
          id: studio._id,
          name: studio.name,
          subscriptionPlan: studio.subscriptionPlan || 'PREMIUM',
          subscriptionStatus: studio.subscriptionStatus || 'ACTIVE',
          subscriptionStartDate: studio.subscriptionStartDate,
          subscriptionExpiresAt: studio.subscriptionExpiresAt,
          logoUrl: studio.logoUrl,
          customDomain: studio.customDomain,
          branding: studio.branding
        },
        ...tokens,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        error: 'આ ઈમેલ રજીસ્ટર થયેલ નથી. કૃપા કરીને પહેલાં રજીસ્ટર (Sign Up) કરો, પછી લોગિન થશે.',
        message: 'This email is not registered. Please register first before logging in.',
        notRegistered: true 
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ 
        error: 'આ એકાઉન્ટ Google થી બનાવેલું છે. કૃપા કરીને નીચે "Continue with Google" બટન દબાવીને લોગિન કરો.',
        message: 'This account was created with Google. Please use Continue with Google.',
        useGoogle: true 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'પાસવર્ડ ખોટો છે. કૃપા કરીને સાચો પાસવર્ડ દાખલ કરો.',
        message: 'Incorrect password. Please try again.'
      });
    }

    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Check if user is associated with any studio
    let studio = null;
    if (user.role === 'STUDIO_OWNER' || isSuperAdmin(user)) {
      studio = await Studio.findOne({ ownerId: user._id });
      if (isSuperAdmin(user)) {
        if (!studio) {
          studio = await Studio.create({
            name: 'Super Admin Studio',
            ownerId: user._id,
            subscriptionPlan: 'PREMIUM',
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: new Date('2099-12-31')
          });
        } else if (!studio.subscriptionPlan) {
          studio.subscriptionPlan = 'PREMIUM';
          studio.subscriptionStatus = 'ACTIVE';
          studio.subscriptionExpiresAt = new Date('2099-12-31');
          await studio.save();
        }
      }
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
  const {
    credential,
    accessToken,
    name: bodyName,
    phone,
    studioName,
    websiteLink,
    instagramUrl,
    facebookUrl,
    whatsappUrl,
    whatsappNumber,
    logoUrl,
    password,
  } = req.body;

  try {
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      '242648487678-j7d799lhhsvigtgpq2k2ngo2tp7ivn7v.apps.googleusercontent.com';
    const client = new OAuth2Client(clientId);

    let email = '';
    let name = (bodyName && typeof bodyName === 'string') ? bodyName.trim() : 'User';

    if (credential) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: [
            clientId,
            '242648487678-j7d799lhhsvigtgpq2k2ngo2tp7ivn7v.apps.googleusercontent.com',
          ],
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email.toLowerCase();
          if (name === 'User' && (payload.name || payload.given_name)) {
            name = payload.name || payload.given_name || 'User';
          }
        }
      } catch (verifyErr: any) {
        console.warn('[GoogleAuth] Google verifyIdToken warning, attempting payload decode:', verifyErr?.message);
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            if (decodedPayload?.email) {
              email = decodedPayload.email.toLowerCase();
              if (name === 'User' && (decodedPayload.name || decodedPayload.given_name)) {
                name = decodedPayload.name || decodedPayload.given_name || 'User';
              }
            }
          }
        } catch (parseErr) {
          console.error('[GoogleAuth] Fallback parse error:', parseErr);
        }
      }

      if (!email) {
        return res.status(400).json({ error: 'Invalid Google credential token' });
      }
    } else if (accessToken) {
      const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.data || !googleRes.data.email) {
        return res.status(400).json({ error: 'Could not fetch Google profile' });
      }
      email = googleRes.data.email.toLowerCase();
      if (name === 'User' && googleRes.data.name) {
        name = googleRes.data.name || 'User';
      }
    } else {
      return res.status(400).json({ error: 'Missing Google credential or access token' });
    }

    let user = await User.findOne({ email });
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await User.create({
        name: name || 'User',
        email,
        phone: cleanPhone || undefined,
        role: 'STUDIO_OWNER',
      });
    } else {
      let userUpdated = false;
      if (name && name !== 'User' && (!user.name || user.name === 'User')) {
        user.name = name;
        userUpdated = true;
      }
      if (cleanPhone && (!user.phone || user.phone !== cleanPhone)) {
        user.phone = cleanPhone;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
      }
    }

    // Set optional password if provided
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
      await user.save();
    }

    const tokens = generateTokens(user._id.toString(), user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    let studio = null;
    if (user.role === 'STUDIO_OWNER') {
      studio = await Studio.findOne({ ownerId: user._id });

      const finalStudioName = studioName?.trim() || (studio ? studio.name : `${user.name}'s Studio`);
      const finalDomain = websiteLink && typeof websiteLink === 'string' && websiteLink.trim() ? websiteLink.trim() : undefined;
      const finalInsta = instagramUrl && typeof instagramUrl === 'string' && instagramUrl.trim() ? instagramUrl.trim() : undefined;
      const finalFb = facebookUrl && typeof facebookUrl === 'string' && facebookUrl.trim() ? facebookUrl.trim() : undefined;
      const finalWa = (whatsappUrl || whatsappNumber) && typeof (whatsappUrl || whatsappNumber) === 'string' && (whatsappUrl || whatsappNumber).trim() ? (whatsappUrl || whatsappNumber).trim() : undefined;
      const finalLogo = logoUrl && typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : undefined;

      if (!studio) {
        studio = await Studio.create({
          name: finalStudioName,
          ownerId: user._id,
          subscriptionPlan: 'BASIC',
          subscriptionStatus: 'FREE',
          customDomain: finalDomain,
          instagramUrl: finalInsta,
          facebookUrl: finalFb,
          whatsappUrl: finalWa,
          logoUrl: finalLogo,
        });
      } else {
        let studioUpdated = false;
        if (studioName && typeof studioName === 'string' && studioName.trim() && studio.name !== studioName.trim()) {
          studio.name = studioName.trim();
          studioUpdated = true;
        }
        if (websiteLink !== undefined && studio.customDomain !== finalDomain) {
          studio.customDomain = finalDomain;
          studioUpdated = true;
        }
        if (instagramUrl !== undefined && studio.instagramUrl !== finalInsta) {
          studio.instagramUrl = finalInsta;
          studioUpdated = true;
        }
        if (facebookUrl !== undefined && studio.facebookUrl !== finalFb) {
          studio.facebookUrl = finalFb;
          studioUpdated = true;
        }
        if (logoUrl !== undefined && studio.logoUrl !== finalLogo) {
          studio.logoUrl = finalLogo;
          studioUpdated = true;
        }
        if (studioUpdated) {
          await studio.save();
        }
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
    return res.status(500).json({ error: err?.message || 'Failed to authenticate with Google' });
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
    if (user.role === 'STUDIO_OWNER' || isSuperAdmin(user)) {
      studio = await Studio.findOne({ ownerId: user._id });
      if (isSuperAdmin(user)) {
        if (!studio) {
          studio = await Studio.create({
            name: 'Super Admin Studio',
            ownerId: user._id,
            subscriptionPlan: 'PREMIUM',
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiresAt: new Date('2099-12-31')
          });
        } else if (!studio.subscriptionPlan) {
          studio.subscriptionPlan = 'PREMIUM';
          studio.subscriptionStatus = 'ACTIVE';
          studio.subscriptionExpiresAt = new Date('2099-12-31');
          await studio.save();
        }
      }
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

/**
 * Update authenticated user & studio profile (used after Google signup or profile editing)
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, phone, studioName, websiteLink, instagramUrl, facebookUrl, logoUrl, password } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name && typeof name === 'string' && name.trim()) user.name = name.trim();
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone) user.phone = cleanPhone;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }
    await user.save();

    let studio = await Studio.findOne({ ownerId: user._id });
    const trimmedDomain = websiteLink !== undefined ? (websiteLink && typeof websiteLink === 'string' && websiteLink.trim() ? websiteLink.trim() : undefined) : undefined;
    const trimmedInsta = instagramUrl !== undefined ? (instagramUrl && typeof instagramUrl === 'string' && instagramUrl.trim() ? instagramUrl.trim() : undefined) : undefined;
    const trimmedFb = facebookUrl !== undefined ? (facebookUrl && typeof facebookUrl === 'string' && facebookUrl.trim() ? facebookUrl.trim() : undefined) : undefined;
    const trimmedLogo = logoUrl !== undefined ? (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : undefined) : undefined;

    if (studio) {
      if (studioName && typeof studioName === 'string' && studioName.trim()) studio.name = studioName.trim();
      if (trimmedDomain !== undefined) studio.customDomain = trimmedDomain;
      if (trimmedInsta !== undefined) studio.instagramUrl = trimmedInsta;
      if (trimmedFb !== undefined) studio.facebookUrl = trimmedFb;
      if (trimmedLogo !== undefined) studio.logoUrl = trimmedLogo;
      await studio.save();
    } else if (studioName && typeof studioName === 'string' && studioName.trim()) {
      studio = await Studio.create({
        name: studioName.trim(),
        ownerId: user._id,
        customDomain: trimmedDomain || undefined,
        instagramUrl: trimmedInsta || undefined,
        facebookUrl: trimmedFb || undefined,
        logoUrl: trimmedLogo || undefined,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      });
    }

    return res.json({ message: 'Profile updated successfully', user, studio });
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
