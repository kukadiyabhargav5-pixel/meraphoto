import { Request, Response } from 'express';
import axios from 'axios';
import { FaceEmbedding, Media, Studio } from '../models';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// InsightFace (ArcFace buffalo_l) cosine similarity thresholds
// Set to 0.40 for strict, highly accurate "microscan" matching
const SIMILARITY_THRESHOLD = 0.40; // Minimum to count as a match
const HIGH_CONFIDENCE_THRESHOLD = 0.65; // High confidence match

/**
 * Calculates cosine similarity between two L2-normalized vectors.
 * For InsightFace ArcFace, values > 0.45 strongly indicate the same person.
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Search photos and videos by uploading a selfie.
 * Flow:
 *   1. Send selfie to AI service → get face embedding(s)
 *   2. Fetch all face embeddings for the event from DB
 *   3. Compare using cosine similarity (no arbitrary limit)
 *   4. Return matched media sorted by similarity score
 *   5. Include indexing status for transparency
 */
export const searchBySelfie = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: 'Selfie photo file is required.' });
    }

    // 1. Call AI service to extract embedding for the selfie
    let faces: any[] = [];
    try {
      const formData = new FormData();
      const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      formData.append('file', fileBlob, 'selfie.jpg');

      const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'bypass-tunnel-reminder': 'true' },
        timeout: 30000,
      });

      faces = aiResponse.data.faces || [];
    } catch (aiErr: any) {
      console.error('[AI Search] AI service connection error:', aiErr.message);
      
      const isOffline =
        aiErr.code === 'ECONNREFUSED' ||
        aiErr.cause?.code === 'ECONNREFUSED' ||
        aiErr.message?.includes('ECONNREFUSED') ||
        aiErr.message?.includes('ENOTFOUND') ||
        aiErr.message?.includes('connect') ||
        aiErr.code === 'ECONNABORTED' ||
        !aiErr.response;

      if (isOffline) {
        return res.status(503).json({ 
          error: 'AI Face Detection service is currently offline or unreachable. Please start the AI service.' 
        });
      }
      return res.status(500).json({ 
        error: 'AI Face Detection service error. Please try again later.' 
      });
    }

    if (faces.length === 0) {
      return res.status(400).json({ 
        error: 'No face detected in the uploaded photo. Please upload a clear, well-lit photo of your face.' 
      });
    }

    // Use the first (usually largest/most prominent) detected face
    const queryEmbedding = faces[0].embedding;

    // 2. Fetch ALL face embeddings for this event (no limit)
    const eventEmbeddings = await FaceEmbedding.find({ eventId });

    if (eventEmbeddings.length === 0) {
      return res.json({ 
        matches: [],
        message: 'No photos have been processed for face detection in this event yet.',
      });
    }

    // 3. Compute similarities against ALL stored embeddings (no arbitrary limit)
    const matches: { mediaId: string; timestamp?: number; similarity: number }[] = [];
    
    for (const item of eventEmbeddings) {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        matches.push({
          mediaId: item.mediaId.toString(),
          timestamp: item.timestamp,
          similarity,
        });
      }
    }

    // 4. Group matches by Media ID (a single photo/video may have multiple face matches)
    const mediaGroups: { 
      [key: string]: { 
        bestSimilarity: number; 
        matchCount: number;
        timestamps: number[];
      } 
    } = {};

    for (const match of matches) {
      if (!mediaGroups[match.mediaId]) {
        mediaGroups[match.mediaId] = {
          bestSimilarity: match.similarity,
          matchCount: 0,
          timestamps: [],
        };
      }
      
      const group = mediaGroups[match.mediaId];
      group.matchCount++;
      
      if (match.similarity > group.bestSimilarity) {
        group.bestSimilarity = match.similarity;
      }
      
      if (match.timestamp !== undefined) {
        group.timestamps.push(match.timestamp);
      }
    }

    for (const mId in mediaGroups) {
      mediaGroups[mId].timestamps.sort((a, b) => a - b);
    }

    // 5. Populate Media details — ALL matches, no limit
    const matchedMediaIds = Object.keys(mediaGroups);
    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } });

    const results = mediaDetails.map((media) => {
      const group = mediaGroups[media._id.toString()];
      const similarityPercent = Math.round(group.bestSimilarity * 100);
      return {
        ...media.toObject(),
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= HIGH_CONFIDENCE_THRESHOLD ? 'HIGH' : group.bestSimilarity >= 0.50 ? 'MEDIUM' : 'LOW',
        matchCount: group.matchCount,
        timestamps: group.timestamps,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    // Increment AI search usage
    if (mediaDetails.length > 0) {
      const firstMedia = mediaDetails[0];
      await Studio.findByIdAndUpdate(firstMedia.studioId, { $inc: { 'usage.aiSearchesCount': 1 } });
    }

    // 6. Get indexing status
    const totalMedia = await Media.countDocuments({ eventId, type: 'PHOTO' });
    const pendingMedia = await Media.countDocuments({
      eventId, type: 'PHOTO',
      faceIndexStatus: { $in: ['PENDING', null] },
    });

    console.log(`[AI Search] Found ${results.length} matching media items for event ${eventId}`);

    return res.json({ 
      matches: results,
      totalSearched: eventEmbeddings.length,
      indexingStatus: { total: totalMedia, pending: pendingMedia },
      message: results.length > 0 
        ? `Found ${results.length} photo(s)/video(s) matching your face!`
        : pendingMedia > 0
          ? `No matching photos found. ${pendingMedia} photos are still being indexed.`
          : 'No matching photos found.',
    });
  } catch (err: any) {
    console.error('AI Face Search Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// We don't need GoogleGenerativeAI anymore since we are using OpenRouter
// import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Handle AI Chatbot interactions using OpenRouter API.
 */
export const chatWithAI = async (req: Request, res: Response) => {
  const { messages } = req.body;

  try {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({ response: "**Server Error:** OpenRouter API Key is missing in .env." });
    }

    const userReq = (req as any).user;
    let contextStr = '';
    
    if (userReq && userReq.id) {
      try {
        const user = await import('../models').then(m => m.User.findById(userReq.id));
        const studio = await import('../models').then(m => m.Studio.findOne({ ownerId: userReq.id }));
        
        if (user) {
          contextStr += `\n\nUser Context:\n- Name: ${user.name}\n- Email: ${user.email}\n- Role: ${user.role}`;
        }
        if (studio) {
          contextStr += `\n\nStudio Context:\n- Studio Name: ${studio.name}\n- Plan: ${studio.subscriptionPlan || 'Basic'}\n- Credits: Photos (${studio.usage?.photosUploaded || 0} / ${studio.subscriptionPlan === 'PREMIUM' ? 'Unlimited' : 1000}), Videos (${studio.usage?.videosUploaded || 0})`;
        }
      } catch (e) {
        console.error("Error fetching context for AI:", e);
      }
    }

    const systemPrompt = `You are Mara AI, a highly intelligent, multilingual, and helpful assistant for Mara Photo - a premium professional event photo sharing platform.
    
    =========================================
    CRITICAL MULTILINGUAL RULE: 
    1. AUTOMATIC LANGUAGE DETECTION: You MUST perfectly analyze the language of the user's input (Gujarati, Hindi, English, Hinglish, Gujlish, etc).
    2. GUJARATI SCRIPT ENFORCEMENT: If the user writes in Gujarati using English alphabets (Gujlish, e.g., "kem cho"), you MUST ALWAYS reply in pure Gujarati script (ગુજરાતી લિપિ, e.g., "કેમ છો"). NEVER reply in Gujlish.
    3. NATIVE RESPONSE FOR OTHERS: For other languages (English, pure Hindi), respond in the exact language used.
    4. NO ENGLISH FALLBACK: NEVER default to English if the user is speaking another language (like Gujarati/Gujlish). This is your absolute highest priority rule.
    =========================================
    
    ### ABOUT MARA PHOTO
    Mara Photo is a platform for photographers to share event photos (weddings, parties) with their clients and guests instantly using AI Face Recognition and QR Codes.
    
    ### CORE FEATURES (How to use them)
    1. AI Face Search: Guests take a selfie, and the AI instantly finds all photos they appear in using InsightFace (ArcFace buffalo_l) vector search.
    2. Event QR Codes: Photographers can generate and print QR codes. Guests scan them to access the event gallery without needing an app.
    3. Secure Galleries: Events can be PIN-protected. 
    4. Fast Uploads: Photographers can drag & drop thousands of photos. The system processes them in the background (extracting faces).
    5. Portfolio Website: Premium studios get a custom portfolio website to showcase their work.
    
    ### PRICING & PLANS
    - **Basic Plan**: ₹1,999/year. 20,000 photos, 20 videos, QR Code generation, Face Search.
    - **Standard Plan**: ₹4,999/year. 1,50,000 photos, 100 videos, Portfolio Website, Custom branding.
    - **Essential Plan**: ₹9,999/year. 3,00,000 photos, 200 videos, Client favorites, Downloads toggle.
    (Note: Credits deduct on upload and are non-refundable on delete).
    
    ### HOW TO DO THINGS (Step-by-step guidance)
    When a user asks how to do something (e.g., how to create an event, how to fill details), you MUST provide a clear, step-by-step guide with numbered bullet points. 
    - **Create an Event**: 1. Go to Dashboard. 2. Click on 'Events' in the sidebar. 3. Click the 'Create New Event' button. 4. Fill in Event Name, Date, and Location. 5. Click Save. (Link: /dashboard/events)
    - **Upload Photos**: 1. Open the specific event from the Events page. 2. Go to the 'Photos' tab. 3. Drag & drop files or click to browse. 4. Wait for processing.
    - **Find Photos (Guest)**: 1. Open the event link. 2. Click 'Find My Photos'. 3. Upload a clear selfie. 4. Wait for the AI to find matches.
    - **Check Credits**: 1. Go to the Dashboard Overview or Events page to see real-time storage credits. (Link: /dashboard/overview)
    - **Upgrade Plan**: 1. Go to Plans & Billing. 2. Choose a new plan. 3. Complete payment. (Link: /dashboard/plans-billing)
    - **Profile/Settings**: 1. Go to Profile in the sidebar. (Link: /dashboard/profile)

    ### LINK PROVISION RULE
    If the user asks for a link to a specific page or if you are guiding them to a page, you MUST provide the exact clickable link to that page using markdown format: [Page Name](/path). 
    Here are the absolute paths you must use:
    - [Events Page](/dashboard/events)
    - [Plans & Billing](/dashboard/plans-billing)
    - [Profile](/dashboard/profile)
    - [Overview](/dashboard/overview)
    - [Team](/dashboard/team)
    - [Queries & Support](/dashboard/queries)
    
    ### SUPPORT
    If they face technical issues, tell them to email maraphoto303@gmail.com or contact support via [Help & Support](/dashboard/queries).
    
    ${contextStr}
    
    Your goal is to answer any question perfectly based on the knowledge above. 
    - ALWAYS provide step-by-step numbered lists when explaining "how" to do something.
    - ALWAYS include direct markdown links to the pages you mention.
    - If they ask about something not covered, answer to the best of your ability as a helpful assistant. Keep formatting clean with bold text and bullet points.`;

    // Format messages for OpenRouter (role: 'system'|'user'|'assistant')
    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini', // Using gpt-4o-mini for speed and cost-effectiveness (or gpt-4o if preferred)
        messages: formattedMessages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Mara Photo Studio',
          'Content-Type': 'application/json',
        }
      }
    );

    const responseText = response.data?.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error("Invalid response format from OpenRouter");
    }

    return res.json({ response: responseText });
  } catch (err: any) {
    console.error('AI Chat Error (OpenRouter):', err?.response?.data || err.message);
    return res.json({ 
      response: "માફ કરજો, કંઈક ભૂલ થઈ છે. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો." 
    });
  }
};
