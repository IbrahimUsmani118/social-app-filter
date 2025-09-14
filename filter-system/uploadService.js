// Upload Service - Direct S3 uploads with presigned URLs (FIXED)
import { awsConfig } from '../utils/aws';
import * as FileSystem from 'expo-file-system';
import { getPresignedUrl } from '../apiHelpers/getPresignedUrl';

// Debug configuration
console.log('🔧 [uploadService] Configuration:', {
  bucket: awsConfig.s3.bucketName,
  region: awsConfig.region,
  presignUrl: awsConfig.presignUrl
});

const MAX_DIRECT_BYTES = 10 * 1024 * 1024; // 10MB

async function _shouldUsePresigned(uri) {
  const { size } = await FileSystem.getInfoAsync(uri, { size: true });
  return size > MAX_DIRECT_BYTES;
}

async function s3ObjectExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function waitForS3(url, attempts = 3, delayMs = 600) {
  const start = Date.now();
  console.log(`[waitForS3] Waiting for S3 object: ${url} (attempts: ${attempts}, delay: ${delayMs}ms)`);
  for (let i = 0; i < attempts; i++) {
    if (await s3ObjectExists(url)) {
      const elapsed = Date.now() - start;
      console.log(`✅ [waitForS3] S3 object found after ${elapsed}ms`);
      return true;
    }
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  console.warn(`⚠️ [waitForS3] S3 object not found after ${attempts} attempts`);
  return false;
}

// REPLACED: Direct S3 upload using working presign service (bypasses broken Lambda)
export const uploadImage = async (fileUri, userId, fileHash, fileInfo) => {
  try {
    console.log('🚀 [uploadImage] Starting DIRECT S3 upload (bypassing broken Lambda)...', {
      fileUri: fileUri?.substring(0, 50) + '...',
      userId,
      fileHash: fileHash?.substring(0, 12) + '...'
    });

    // Step 1: Generate unique filename
    const timestamp = Date.now();
    const fileExtension = fileInfo?.fileName?.split('.').pop() || fileInfo?.name?.split('.').pop() || 'jpg';
    const fileName = `${userId}_${timestamp}_${fileHash.substring(0, 8)}.${fileExtension}`;
    
    // Fix content type if it's just "image"
    let finalContentType = fileInfo?.type || 'image/jpeg';
    if (finalContentType === 'image') {
      if (fileName.toLowerCase().endsWith('.png')) {
        finalContentType = 'image/png';
      } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        finalContentType = 'image/jpeg';
      } else if (fileName.toLowerCase().endsWith('.gif')) {
        finalContentType = 'image/gif';
      } else if (fileName.toLowerCase().endsWith('.webp')) {
        finalContentType = 'image/webp';
      } else {
        finalContentType = 'image/jpeg';
      }
    }

    console.log('📝 [uploadImage] File details:', {
      fileName,
      contentType: finalContentType,
      fileHash: fileHash?.substring(0, 12) + '...',
      userId
    });

    // Step 2: Get presigned URL from your working presign service
    console.log('📋 [uploadImage] Getting presigned URL...');
    const presignData = await getPresignedUrl(fileName, finalContentType, 'put');
    
    if (!presignData || !presignData.uploadUrl) {
      throw new Error('Failed to get presigned URL from service');
    }

    console.log('✅ [uploadImage] Presigned URL obtained:', {
      method: presignData.method,
      s3Key: presignData.s3Key,
      bucket: presignData.bucket,
      urlPreview: presignData.uploadUrl.substring(0, 80) + '...'
    });

    // Step 3: Read the image file as blob
    console.log('📖 [uploadImage] Reading image file...');
    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.status}`);
    }
    const blob = await response.blob();

    const fileSizeInMB = (blob.size || 0) / (1024 * 1024);
    console.log('📤 [uploadImage] Uploading to S3...', {
      blobSize: fileSizeInMB.toFixed(2) + 'MB',
      contentType: finalContentType
    });

    // Step 4: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': finalContentType,
      },
      body: blob
    });

    console.log('📥 [uploadImage] S3 response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [uploadImage] S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText.substring(0, 200)
      });
      throw new Error(`S3 upload failed: ${uploadResponse.status} - ${uploadResponse.statusText}`);
    }

    console.log('✅ [uploadImage] Upload successful!');

    // Step 5: Construct the final image URL
    const imageUrl = presignData.imageUrl || `https://${presignData.bucket}.s3.${awsConfig.region}.amazonaws.com/${presignData.s3Key}`;

    console.log('🎉 [uploadImage] Image available at:', imageUrl);

    // Step 6: Wait for S3 propagation (optional but recommended)
    await waitForS3(imageUrl, 2, 500);

    return imageUrl;

  } catch (error) {
    console.error('❌ [uploadImage] Error:', error);
    throw new Error(`Direct S3 upload failed: ${error.message}`);
  }
};

/**
 * Check if upload service is available
 */
export const isUploadServiceAvailable = () => {
  return !!awsConfig.presignUrl; // Changed to check presign URL instead of broken upload URL
};

/**
 * Get upload service configuration
 */
export const getUploadServiceConfig = () => ({
  presignUrl: awsConfig.presignUrl, // Changed to show presign URL
  uploadMethod: 'direct-s3', // Updated method
  available: isUploadServiceAvailable(),
  bucket: awsConfig.s3.bucketName,
  region: awsConfig.region
});