// API Helper for getting presigned URLs
import { awsConfig } from '../utils/aws';

/**
 * Get a presigned URL for S3 upload
 * @param {string} filename - The filename to upload
 * @param {string} contentType - The MIME type of the file
 * @param {string} method - The HTTP method ('put' or 'post')
 * @returns {Promise<{method: string, uploadUrl: string, uploadFields: object, s3Key: string, bucket: string, imageUrl: string}>}
 */
export const getPresignedUrl = async (filename, contentType, method = 'put') => {
  try {
    console.log('🔗 [getPresignedUrl] Requesting presigned URL:', {
      filename,
      contentType,
      method,
      presignUrl: awsConfig.presignUrl
    });

    // Generate unique S3 key
    const timestamp = Date.now();
    const fileExtension = filename.split('.').pop() || 'jpg';
    const s3Key = `images/${timestamp}_${filename}`;

    const response = await fetch(awsConfig.presignUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: s3Key,
        contentType,
        method,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [getPresignedUrl] API error:', response.status, errorText);
      throw new Error(`Presigned URL request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Generate the final image URL
    const imageUrl = `https://${awsConfig.s3.bucketName}.s3.${awsConfig.region}.amazonaws.com/${s3Key}`;

    console.log('✅ [getPresignedUrl] Presigned URL received:', {
      method: result.method || method,
      s3Key,
      bucket: awsConfig.s3.bucketName,
      imageUrl: imageUrl.substring(0, 50) + '...'
    });

    return {
      method: result.method || method,
      uploadUrl: result.presignedUrl || result.uploadUrl,
      uploadFields: result.uploadFields || {},
      s3Key,
      bucket: awsConfig.s3.bucketName,
      imageUrl,
    };
  } catch (error) {
    console.error('❌ [getPresignedUrl] Error:', error);
    throw error;
  }
};

/**
 * Check if presigned URL service is available
 * @returns {boolean}
 */
export const isPresignedUrlAvailable = () => {
  return !!(awsConfig.presignUrl && awsConfig.presignUrl !== 'YOUR_PRESIGN_URL');
};

/**
 * Get presigned URL configuration
 * @returns {object}
 */
export const getPresignedUrlConfig = () => ({
  presignUrl: awsConfig.presignUrl,
  isAvailable: isPresignedUrlAvailable(),
  s3Bucket: awsConfig.s3.bucketName,
  region: awsConfig.region,
});

export default getPresignedUrl;
