import { Request, Response } from 'express';
import ChatLead, { IChatMessage } from '../models/ChatLead';

// Smart FAQ Knowledge Base for instant AI/Automated replies
const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['price', 'pricing', 'cost', 'charge', 'rate', 'package', 'plan', 'fees', 'rupee', 'rs'],
    response: `💎 **Mara Photo Plans & Pricing:**
• **Starter / Trial:** Free trial available with complimentary credits to test AI face recognition!
• **Studio Pro:** Ideal for active photographers & event planners with bulk upload, high-speed face matching, and custom branding.
• **Enterprise / Unlimited:** Custom retention, priority AI worker queues, and unlimited storage.

👉 Visit our [Plans & Pricing](/pricing) page for full feature comparison, or leave your phone number in the **"Request Call"** tab for a custom studio quote!`
  },
  {
    keywords: ['face', 'ai', 'recognition', 'selfie', 'search', 'find photo', 'how it work', 'accuracy'],
    response: `⚡ **AI Face Recognition:**
Guests don't have to scroll through thousands of event photos!
1. Guest scans your Event QR Code at the venue.
2. They snap or upload a single selfie.
3. Our neural network matches their face in under **2 seconds** across thousands of photos with **99.8% accuracy**!
4. Guests can instantly view and download their private gallery.`
  },
  {
    keywords: ['call', 'contact', 'phone', 'mobile', 'speak', 'talk', 'number', 'reach', 'support'],
    response: `📞 **Direct Call Support:**
We'd love to speak with you! You can switch to the **"Request Call"** tab above and submit your phone number. 
Our senior team will call you back within **2 to 3 hours** to assist you with all your questions and live demonstration.`
  },
  {
    keywords: ['storage', 'cloud', 'validity', 'retention', 'expire', 'gb', 'save', 'backup'],
    response: `☁️ **Cloud Storage & Retention:**
• Secure, redundant cloud storage with multi-region backup.
• Flexible event retention options: **1 Month, 6 Months, or 1 Year**.
• Automated storage management so you never lose high-resolution client photos.`
  },
  {
    keywords: ['qr', 'qr code', 'share', 'guest', 'link', 'access'],
    response: `📱 **Instant QR Code Sharing:**
• Each event generates a unique, high-resolution printable QR code.
• Display it on welcome stands, tables, or digital invitations.
• Guests can scan from any iPhone or Android camera—**no app installation required!**`
  },
  {
    keywords: ['watermark', 'privacy', 'security', 'protect', 'safe', 'logo', 'steal'],
    response: `🔒 **Security & Watermark Protection:**
• Upload your studio watermark logo with automatic diagonal or corner placement.
• Download permissions control: allow full-res downloads or preview-only.
• Optional event PIN or guest phone verification for maximum privacy.`
  },
  {
    keywords: ['studio', 'brand', 'bill', 'quotation', 'invoice', 'crm'],
    response: `🎨 **Studio Branding & Business Tools:**
Mara Photo is an all-in-one suite for studios:
• White-label galleries with your studio logo & color palette.
• Built-in 1-click Quotation & PDF Invoice generator.
• Client management, shoot scheduling, and team tracking dashboard.`
  },
  {
    keywords: ['demo', 'trial', 'free', 'test', 'sample'],
    response: `✨ **Free Demo & Trial:**
You can sign up in seconds and test creating an event for free! 
Want a live guided walkthrough for your studio? Submit your number in the **"Request Call"** tab and our expert will guide you.`
  }
];

// Helper to find matching FAQ response
function findFaqResponse(userMessage: string): string | null {
  const clean = userMessage.toLowerCase();
  for (const item of FAQ_KNOWLEDGE_BASE) {
    const match = item.keywords.some(keyword => clean.includes(keyword));
    if (match) {
      return item.response;
    }
  }
  return null;
}

// Check if message looks like a phone number
function extractPhoneNumber(text: string): string | null {
  const match = text.match(/(?:\+?91[\-\s]?)?[6-9]\d{9}/);
  return match ? match[0].replace(/[\-\s]/g, '') : null;
}

// Smart Name extraction from conversational messages
function extractNameFromText(text: string): string | null {
  const match = text.match(/(?:my name is|i am|this is|name is|i'm|hu|hu chu|maru naam|naam)\s+([A-Za-z\s]{2,30}?)(?:\s+(?:founder|from|and|here|ke|chu|my|the|of)|$|\.|\,)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    const lower = raw.toLowerCase();
    if (['interested', 'looking', 'here', 'writing', 'asking', 'wondering', 'not', 'available', 'calling'].includes(lower)) {
      return null;
    }
    return raw
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return null;
}

/**
 * Visitor sends a message
 * POST /api/chatbot/message
 */
export const handleVisitorMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, visitorInfo } = req.body;

    if (!sessionId || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'sessionId and message are required' });
    }

    const trimmedMsg = message.trim();

    let lead = await ChatLead.findOne({ sessionId });
    if (!lead) {
      lead = new ChatLead({
        sessionId,
        name: (visitorInfo?.name && visitorInfo.name !== 'Website Visitor') ? visitorInfo.name : 'Website Visitor',
        phone: visitorInfo?.phone,
        email: visitorInfo?.email,
        sourceUrl: visitorInfo?.sourceUrl || '/',
        device: visitorInfo?.device || 'Desktop/Mobile',
        messages: [],
      });
    } else {
      if (visitorInfo?.name && visitorInfo.name !== 'Website Visitor') lead.name = visitorInfo.name;
      if (visitorInfo?.phone && !lead.phone) lead.phone = visitorInfo.phone;
      if (visitorInfo?.email && !lead.email) lead.email = visitorInfo.email;
    }

    // Auto-detect name if still "Website Visitor"
    if (lead.name === 'Website Visitor' || !lead.name) {
      const detectedName = extractNameFromText(trimmedMsg);
      if (detectedName) {
        lead.name = detectedName;
      }
    }

    // Auto-detect phone number in message
    const detectedPhone = extractPhoneNumber(trimmedMsg);
    if (detectedPhone && !lead.phone) {
      lead.phone = detectedPhone;
      lead.callbackRequested = true;
      lead.callbackStatus = 'pending';
      lead.callbackRequestedAt = new Date();
    }

    // Append visitor message
    lead.messages.push({
      sender: 'visitor',
      senderName: lead.name || 'Visitor',
      text: trimmedMsg,
      timestamp: new Date(),
    });

    lead.unreadForAdmin = (lead.unreadForAdmin || 0) + 1;
    lead.lastMessageText = trimmedMsg;
    lead.lastMessageAt = new Date();
    lead.status = 'active';

    // Check for smart FAQ response
    const faqAnswer = findFaqResponse(trimmedMsg);
    if (faqAnswer) {
      lead.messages.push({
        sender: 'bot',
        senderName: 'Mara AI Concierge',
        text: faqAnswer,
        timestamp: new Date(),
      });
      lead.lastMessageText = faqAnswer.substring(0, 100) + '...';
    } else if (detectedPhone) {
      // If phone detected and no specific FAQ, add reassuring confirmation
      const phoneAck = `📞 Thank you! We have noted your number (${detectedPhone}). Our team will call you within **2 to 3 hours**!`;
      lead.messages.push({
        sender: 'bot',
        senderName: 'Mara AI Concierge',
        text: phoneAck,
        timestamp: new Date(),
      });
    }

    await lead.save();

    return res.json({
      success: true,
      lead,
      latestBotMessage: faqAnswer || (detectedPhone ? `Phone received` : null),
    });
  } catch (error: any) {
    console.error('Error handling visitor message:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Visitor requests a callback
 * POST /api/chatbot/callback
 */
export const requestCallback = async (req: Request, res: Response) => {
  try {
    const { sessionId, name, phone, sourceUrl, device, notes } = req.body;

    if (!sessionId || !phone) {
      return res.status(400).json({ success: false, message: 'sessionId and phone are required' });
    }

    let lead = await ChatLead.findOne({ sessionId });
    if (!lead) {
      lead = new ChatLead({
        sessionId,
        name: name || 'Website Visitor',
        phone,
        sourceUrl: sourceUrl || '/',
        device: device || 'Web',
        messages: [],
      });
    } else {
      if (name) lead.name = name;
      lead.phone = phone;
      if (sourceUrl) lead.sourceUrl = sourceUrl;
    }

    lead.callbackRequested = true;
    lead.callbackStatus = 'pending';
    lead.callbackTimeNotice = 'Within 2-3 hours';
    lead.callbackRequestedAt = new Date();
    if (notes) lead.callbackNotes = notes;

    const confirmationMsg = `📞 **Callback Request Confirmed!**\nThank you, ${lead.name || 'there'}! We have received your phone number (${phone}).\nOur team will call you within **2 to 3 hours** with complete details.`;

    lead.messages.push({
      sender: 'bot',
      senderName: 'Mara Support',
      text: confirmationMsg,
      timestamp: new Date(),
    });

    lead.unreadForAdmin = (lead.unreadForAdmin || 0) + 1;
    lead.lastMessageText = `[Callback Request] ${phone}`;
    lead.lastMessageAt = new Date();
    lead.status = 'active';

    await lead.save();

    return res.json({
      success: true,
      message: 'Callback request registered successfully',
      lead,
    });
  } catch (error: any) {
    console.error('Error requesting callback:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Get visitor conversation history
 * GET /api/chatbot/conversation/:sessionId
 */
export const getVisitorConversation = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const lead = await ChatLead.findOne({ sessionId });
    if (!lead) {
      return res.json({
        success: true,
        exists: false,
        lead: null,
        messages: [],
      });
    }

    // Reset unread count for visitor since they opened conversation
    if (lead.unreadForVisitor > 0) {
      lead.unreadForVisitor = 0;
      await lead.save();
    }

    return res.json({
      success: true,
      exists: true,
      lead,
      messages: lead.messages,
    });
  } catch (error: any) {
    console.error('Error getting visitor conversation:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Get all conversations and callback requests
 * GET /api/chatbot/admin/conversations
 */
export const getAdminConversations = async (req: Request, res: Response) => {
  try {
    const { filter, search } = req.query;

    const query: any = {};

    if (filter === 'callback') {
      query.callbackRequested = true;
    } else if (filter === 'pending_callback') {
      query.callbackRequested = true;
      query.callbackStatus = 'pending';
    } else if (filter === 'unread') {
      query.unreadForAdmin = { $gt: 0 };
    }

    if (search && typeof search === 'string') {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { lastMessageText: { $regex: s, $options: 'i' } },
      ];
    }

    const conversations = await ChatLead.find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(100);

    // Auto-heal leads that have "Website Visitor" but mentioned their name in chat
    for (const conv of conversations) {
      if ((conv.name === 'Website Visitor' || !conv.name) && conv.messages && conv.messages.length > 0) {
        for (const m of conv.messages) {
          if (m.sender === 'visitor') {
            const detected = extractNameFromText(m.text);
            if (detected) {
              conv.name = detected;
              await ChatLead.findByIdAndUpdate(conv._id, { name: detected });
              break;
            }
          }
        }
      }
    }

    // Global stats for dashboard
    const pendingCallbacksCount = await ChatLead.countDocuments({
      callbackRequested: true,
      callbackStatus: 'pending',
    });

    const unreadMessagesCount = await ChatLead.countDocuments({
      unreadForAdmin: { $gt: 0 },
    });

    const totalLeadsToday = await ChatLead.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    return res.json({
      success: true,
      conversations,
      stats: {
        pendingCallbacks: pendingCallbacksCount,
        unreadMessages: unreadMessagesCount,
        totalLeadsToday,
        total: await ChatLead.countDocuments(),
      },
    });
  } catch (error: any) {
    console.error('Error getting admin conversations:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Get single conversation detail and mark read
 * GET /api/chatbot/admin/conversation/:id
 */
export const getAdminConversationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await ChatLead.findById(id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (lead.unreadForAdmin > 0) {
      lead.unreadForAdmin = 0;
      await lead.save();
    }

    return res.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    console.error('Error getting conversation by id:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Reply to visitor
 * POST /api/chatbot/admin/reply
 */
export const adminReplyToVisitor = async (req: Request, res: Response) => {
  try {
    const { id, sessionId, text, adminName } = req.body;

    if ((!id && !sessionId) || !text) {
      return res.status(400).json({ success: false, message: 'id/sessionId and text are required' });
    }

    const lead = id ? await ChatLead.findById(id) : await ChatLead.findOne({ sessionId });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const senderDisplay = adminName || 'Super Admin';

    lead.messages.push({
      sender: 'admin',
      senderName: senderDisplay,
      text: text.trim(),
      timestamp: new Date(),
    });

    lead.unreadForVisitor = (lead.unreadForVisitor || 0) + 1;
    lead.unreadForAdmin = 0; // Admin replied, so admin unread is 0
    lead.lastMessageText = text.trim();
    lead.lastMessageAt = new Date();

    await lead.save();

    return res.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    console.error('Error in admin reply:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Update Callback status
 * PUT /api/chatbot/admin/callback-status
 */
export const updateCallbackStatus = async (req: Request, res: Response) => {
  try {
    const { id, callbackStatus, callbackNotes } = req.body;

    if (!id || !callbackStatus) {
      return res.status(400).json({ success: false, message: 'id and callbackStatus are required' });
    }

    const lead = await ChatLead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    lead.callbackStatus = callbackStatus;
    if (callbackNotes !== undefined) {
      lead.callbackNotes = callbackNotes;
    }

    await lead.save();

    return res.json({
      success: true,
      message: 'Callback status updated',
      lead,
    });
  } catch (error: any) {
    console.error('Error updating callback status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Update Lead profile (name, phone, email, notes)
 * PUT /api/chatbot/admin/update-lead
 */
export const updateLeadInfo = async (req: Request, res: Response) => {
  try {
    const { id, name, phone, email, notes } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }

    const lead = await ChatLead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      lead.name = name.trim();
    }
    if (phone !== undefined) {
      lead.phone = phone.trim();
    }
    if (email !== undefined) {
      lead.email = email.trim();
    }
    if (notes !== undefined) {
      lead.callbackNotes = notes;
    }

    await lead.save();

    return res.json({
      success: true,
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error: any) {
    console.error('Error updating lead info:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

/**
 * Admin: Delete / Archive conversation
 * DELETE /api/chatbot/admin/conversation/:id
 */
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ChatLead.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
