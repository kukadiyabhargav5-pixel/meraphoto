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
 *   3. Compare using cosine similarity
 *   4. Return matched media sorted by similarity score
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
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 second timeout for AI processing
      });

      faces = aiResponse.data.faces || [];
    } catch (aiErr: any) {
      console.error('[AI Search] AI service connection error:', aiErr.message);
      
      if (aiErr.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'AI Face Detection service is not running. Please start the AI service on port 8000.' 
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

    // 2. Fetch all face embeddings for this event
    const eventEmbeddings = await FaceEmbedding.find({ eventId });

    if (eventEmbeddings.length === 0) {
      return res.json({ 
        matches: [],
        message: 'No photos have been processed for face detection in this event yet.',
      });
    }

    // 3. Compute similarities against all stored embeddings
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
      
      // Track highest similarity for this media item
      if (match.similarity > group.bestSimilarity) {
        group.bestSimilarity = match.similarity;
      }
      
      // Track video timestamps
      if (match.timestamp !== undefined) {
        group.timestamps.push(match.timestamp);
      }
    }

    // Sort timestamps for video matches
    for (const mId in mediaGroups) {
      mediaGroups[mId].timestamps.sort((a, b) => a - b);
    }

    // 5. Populate Media details
    const matchedMediaIds = Object.keys(mediaGroups);
    const mediaDetails = await Media.find({ _id: { $in: matchedMediaIds } });

    const results = mediaDetails.map((media) => {
      const group = mediaGroups[media._id.toString()];
      const similarityPercent = Math.round(group.bestSimilarity * 100);
      return {
        ...media.toObject(),
        similarity: parseFloat(group.bestSimilarity.toFixed(4)),
        similarityPercent,
        confidence: group.bestSimilarity >= HIGH_CONFIDENCE_THRESHOLD ? 'HIGH' : 'MEDIUM',
        matchCount: group.matchCount,
        timestamps: group.timestamps,
      };
    });

    // Sort by similarity score (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Increment AI search usage
    if (mediaDetails.length > 0) {
      const firstMedia = mediaDetails[0];
      await Studio.findByIdAndUpdate(firstMedia.studioId, { $inc: { 'usage.aiSearchesCount': 1 } });
    }

    console.log(`[AI Search] Found ${results.length} matching media items for event ${eventId}`);

    return res.json({ 
      matches: results,
      totalSearched: eventEmbeddings.length,
      message: results.length > 0 
        ? `Found ${results.length} photo(s)/video(s) matching your face!`
        : 'No matching photos found. The event photos may not have been processed yet.',
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
        const studio = await import('../models').then(m => m.Studio.findOne({ owner: userReq.id }));
        
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

    const systemPrompt = `You are Mara AI, a highly intelligent, polite, and helpful assistant for Mara Photo - a premium professional event photo sharing platform.
    
    CRITICAL RULE: You MUST always respond in the exact same language that the user is speaking. (Gujarati, Hindi, English, etc).
    
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
    
    ### HOW TO DO THINGS
    - **Create an Event**: Go to Dashboard > Events > 'Create New Event'. Fill in the details.
    - **Upload Photos**: Open an event, go to the 'Photos' tab, and drag & drop files.
    - **Find Photos (Guest)**: Open the event link, click 'Find My Photos', upload a selfie.
    - **Check Credits**: Go to Dashboard > Events to see real-time storage credits.
    - **Upgrade Plan**: Go to Dashboard > Plans & Billing to purchase more storage.
    
    ### SUPPORT
    If they face technical issues, tell them to email maraphoto303@gmail.com or contact support.
    
    ${contextStr}
    
    Your goal is to answer any question perfectly based on the knowledge above. If they ask about something not covered, answer to the best of your ability as a helpful assistant. Keep formatting clean with bold text and bullet points.`;

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
