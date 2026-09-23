import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

/**
 * Uploads a buffer directly to ImageKit
 * Returns the secure URL and the fileId
 */
export const uploadFile = async (
  fileBuffer: Buffer,
  folder: string = 'mara-photo'
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    imagekit.upload({
      file: fileBuffer.toString('base64'), // ImageKit expects base64 string for buffer
      fileName: `upload_${Date.now()}`,
      folder: folder,
    }, function(error: any, result: any) {
      if(error) {
        console.error('ImageKit Upload Error:', error);
        return reject(error);
      }
      if (result) {
         resolve({
           url: result.url,
           publicId: result.fileId,
         });
      }
    });
  });
};

/**
 * Deletes a file from ImageKit given its fileId
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    await new Promise((resolve, reject) => {
        imagekit.deleteFile(fileId, function(error: any, result: any) {
            if (error) {
               console.error(`Failed to delete ImageKit file: ${fileId}`, error);
               return reject(error);
            }
            resolve(result);
        });
    });
  } catch (error) {
    console.error(`Failed to delete ImageKit file: ${fileId}`, error);
  }
};

/**
 * Generate ImageKit authentication parameters for client-side uploads
 */
export const generateSignature = () => {
  return imagekit.getAuthenticationParameters();
};
