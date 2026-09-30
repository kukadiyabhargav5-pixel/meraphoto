import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.WHATSAPP_API_URL || '';
const TOKEN = process.env.WHATSAPP_TOKEN || '';

/**
 * Interface for Meta's WhatsApp Cloud API Template parameters
 */
interface WhatsAppParameter {
  type: 'text' | 'image' | 'document';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename: string };
}

interface WhatsAppComponent {
  type: 'header' | 'body' | 'button';
  index?: string;
  parameters: WhatsAppParameter[];
}

/**
 * Core sender function that communicates with Meta WhatsApp API
 */
export const sendWhatsAppTemplate = async (
  to: string,
  templateName: string,
  components: WhatsAppComponent[],
  languageCode = 'en_US'
): Promise<any> => {
  // If API URL or Token is unconfigured or mock, fall back to mock logger
  if (!API_URL || !TOKEN || TOKEN.includes('mock') || API_URL.includes('localhost')) {
    console.log(`\n--- [MOCK WHATSAPP NOTIFICATION] ---`);
    console.log(`To: ${to}`);
    console.log(`Template: ${templateName}`);
    console.log(`Language: ${languageCode}`);
    console.log(`Components:`, JSON.stringify(components, null, 2));
    console.log(`-------------------------------------\n`);
    return { message_status: 'accepted', mock: true };
  }

  try {
    const response = await axios.post(
      API_URL,
      {
        messaging_product: 'whatsapp',
        to: to.startsWith('+') ? to.substring(1) : to, // WhatsApp API requires number without '+'
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('WhatsApp Service Error:', error.response?.data || error.message);
    throw new Error(`WhatsApp Send Failure: ${error.response?.data?.error?.message || error.message}`);
  }
};

/**
 * WhatsApp Template Helper: Event Ready
 */
export const sendEventReadyWhatsApp = async (
  to: string,
  clientName: string,
  eventName: string,
  galleryLink: string
) => {
  const components: WhatsAppComponent[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: clientName },
        { type: 'text', text: eventName },
        { type: 'text', text: galleryLink },
      ],
    },
  ];
  return sendWhatsAppTemplate(to, 'event_ready', components);
};

/**
 * WhatsApp Template Helper: Photos Ready
 */
export const sendPhotosReadyWhatsApp = async (
  to: string,
  clientName: string,
  eventName: string,
  galleryLink: string
) => {
  const components: WhatsAppComponent[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: clientName },
        { type: 'text', text: eventName },
        { type: 'text', text: galleryLink },
      ],
    },
  ];
  return sendWhatsAppTemplate(to, 'photos_ready', components);
};

/**
 * WhatsApp Template Helper: Download ZIP Ready
 */
export const sendDownloadReadyWhatsApp = async (
  to: string,
  clientName: string,
  downloadLink: string
) => {
  const components: WhatsAppComponent[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: clientName },
        { type: 'text', text: downloadLink },
      ],
    },
  ];
  return sendWhatsAppTemplate(to, 'download_ready', components);
};
