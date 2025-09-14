import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig, validateAwsConfig } from '../utils/aws-simple.js';

const router = express.Router();

// Create S3 client
const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials.accessKeyId ? {
    accessKeyId: awsConfig.credentials.accessKeyId,
    secretAccessKey: awsConfig.credentials.secretAccessKey,
  } : undefined,
});

router.post('/', async (req, res, next) => {
  try {
    // Validate configuration
    const configValidation = validateAwsConfig();
    if (!configValidation.isValid) {
      return res.status(500).json({
        error: 'Configuration error',
        details: configValidation.errors,
      });
    }

    const { filename, contentType, method = 'put' } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        error: 'filename is required',
      });
    }

    // Generate unique S3 key
    const timestamp = Date.now();
    const _fileExtension = filename.split('.').pop() || 'jpg';
    const s3Key = `images/${timestamp}_${filename}`;

    console.log('🔗 [presign] Generating presigned URL:', {
      filename,
      contentType,
      method,
      s3Key,
      bucket: awsConfig.s3.bucketName,
    });

    if (method === 'post') {
      // Use presigned POST for form uploads
      const { createPresignedPost } = await import('@aws-sdk/s3-presigned-post');
      
      const presigned = await createPresignedPost(s3Client, {
        Bucket: awsConfig.s3.bucketName,
        Key: s3Key,
        Fields: {
          'Content-Type': contentType || 'image/jpeg',
        },
        Conditions: [
          ['content-length-range', 0, 10 * 1024 * 1024], // 10MB max
        ],
        Expires: 300, // 5 minutes
      });

      console.log('✅ [presign] Presigned POST generated:', {
        s3Key,
        url: presigned.url.substring(0, 50) + '...',
      });

      res.json({
        method: 'post',
        uploadUrl: presigned.url,
        uploadFields: presigned.fields,
        s3Key,
        bucket: awsConfig.s3.bucketName,
        imageUrl: `https://${awsConfig.s3.bucketName}.s3.${awsConfig.region}.amazonaws.com/${s3Key}`,
      });
    } else {
      // Use presigned PUT for direct uploads
      const command = new PutObjectCommand({
        Bucket: awsConfig.s3.bucketName,
        Key: s3Key,
        ContentType: contentType || 'image/jpeg',
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 300, // 5 minutes
      });

      console.log('✅ [presign] Presigned PUT generated:', {
        s3Key,
        url: presignedUrl.substring(0, 50) + '...',
      });

      res.json({
        method: 'put',
        uploadUrl: presignedUrl,
        uploadFields: {},
        s3Key,
        bucket: awsConfig.s3.bucketName,
        imageUrl: `https://${awsConfig.s3.bucketName}.s3.${awsConfig.region}.amazonaws.com/${s3Key}`,
      });
    }
  } catch (err) {
    console.error('❌ [presign] Error generating presigned URL:', err);
    next(err);
  }
});

export default router; 