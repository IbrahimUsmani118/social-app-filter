// Simplified AWS utilities for Node.js (without Expo dependencies)
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Environment configuration helper
const getEnv = (key, fallback = '') =>
  process.env[key] || fallback;

// AWS Configuration
const awsConfig = {
  region: getEnv('AWS_REGION', 'us-east-1'),
  s3: {
    bucketName: getEnv('AWS_BUCKET', 'YOUR_S3_BUCKET_NAME'),
    region: getEnv('AWS_REGION', 'us-east-1'),
  },
  dynamoDB: {
    tableName: getEnv('DYNAMODB_TABLE', 'ImageSignatures'),
    region: getEnv('AWS_REGION', 'us-east-1'),
  },
  cognito: {
    region: getEnv('AWS_REGION', 'us-east-1'),
    identityPoolId: getEnv('COGNITO_IDENTITY_POOL_ID', 'us-east-1:your-identity-pool-id'),
  },
  credentials: {
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
  },
  app: {
    hashFieldName: 'ContentHash',
    timestampFieldName: 'Timestamp',
    ttlFieldName: 'TTL',
    defaultTTLInDays: 30,
  },
  presignUrl: getEnv('PRESIGN_URL', 'http://localhost:4000/presigned-url'),
  presignApiKey: getEnv('PRESIGN_API_KEY', 'your-api-key'),
};

// Initialize AWS clients
const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials.accessKeyId ? {
    accessKeyId: awsConfig.credentials.accessKeyId,
    secretAccessKey: awsConfig.credentials.secretAccessKey,
  } : undefined,
});

const ddbClient = new DynamoDBClient({
  region: awsConfig.region,
  credentials: awsConfig.credentials.accessKeyId ? {
    accessKeyId: awsConfig.credentials.accessKeyId,
    secretAccessKey: awsConfig.credentials.secretAccessKey,
  } : undefined,
});

const lambdaClient = new CognitoIdentityProviderClient({
  region: awsConfig.region,
  credentials: awsConfig.credentials.accessKeyId ? {
    accessKeyId: awsConfig.credentials.accessKeyId,
    secretAccessKey: awsConfig.credentials.secretAccessKey,
  } : undefined,
});

// Generate file hash (Node.js version)
export async function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Check image upload limit
export async function checkImageUploadLimit(fileHash, maxUploads = 3) {
  try {
    const command = new GetItemCommand({
      TableName: awsConfig.dynamoDB.tableName,
      Key: {
        [awsConfig.app.hashFieldName]: { S: fileHash }
      }
    });

    const result = await ddbClient.send(command);
    
    if (!result.Item) {
      return {
        count: 0,
        blocked: false,
        warning: false,
      };
    }

    const count = parseInt(result.Item.UploadCount?.N || '0');
    
    return {
      count,
      blocked: count >= maxUploads,
      warning: count >= maxUploads - 1,
    };
  } catch (error) {
    console.error('Error checking upload limit:', error);
    return {
      count: 0,
      blocked: false,
      warning: false,
    };
  }
}

// Increment image upload count
export async function incrementImageUploadCount(userId, userName, fileHash, fileName) {
  try {
    const command = new PutItemCommand({
      TableName: awsConfig.dynamoDB.tableName,
      Item: {
        [awsConfig.app.hashFieldName]: { S: fileHash },
        [awsConfig.app.timestampFieldName]: { S: new Date().toISOString() },
        [awsConfig.app.ttlFieldName]: { N: (Math.floor(Date.now() / 1000) + (awsConfig.app.defaultTTLInDays * 24 * 60 * 60)).toString() },
        UserId: { S: userId },
        UserName: { S: userName },
        FileName: { S: fileName },
        UploadCount: { N: '1' },
      },
      ConditionExpression: 'attribute_not_exists(ContentHash)',
    });

    await ddbClient.send(command);
    return { success: true, count: 1 };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      // Item exists, increment count
      const updateCommand = new PutItemCommand({
        TableName: awsConfig.dynamoDB.tableName,
        Item: {
          [awsConfig.app.hashFieldName]: { S: fileHash },
          [awsConfig.app.timestampFieldName]: { S: new Date().toISOString() },
          [awsConfig.app.ttlFieldName]: { N: (Math.floor(Date.now() / 1000) + (awsConfig.app.defaultTTLInDays * 24 * 60 * 60)).toString() },
          UserId: { S: userId },
          UserName: { S: userName },
          FileName: { S: fileName },
          UploadCount: { N: '1' },
        },
        UpdateExpression: 'ADD UploadCount :inc',
        ExpressionAttributeValues: {
          ':inc': { N: '1' },
        },
      });

      await ddbClient.send(updateCommand);
      return { success: true, count: 1 };
    }
    
    console.error('Error incrementing upload count:', error);
    throw error;
  }
}

// Validate AWS configuration
export function validateAwsConfig() {
  const errors = [];
  
  if (!awsConfig.s3.bucketName || awsConfig.s3.bucketName === 'YOUR_S3_BUCKET_NAME') {
    errors.push('S3 bucket name not configured');
  }
  
  if (!awsConfig.dynamoDB.tableName || awsConfig.dynamoDB.tableName === 'YOUR_DYNAMODB_TABLE') {
    errors.push('DynamoDB table name not configured');
  }
  
  if (!awsConfig.credentials.accessKeyId) {
    errors.push('AWS access key ID not configured');
  }
  
  if (!awsConfig.credentials.secretAccessKey) {
    errors.push('AWS secret access key not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get AWS configuration debug info
export function getAwsConfigDebug() {
  return {
    region: awsConfig.region,
    s3Bucket: awsConfig.s3.bucketName,
    dynamoTable: awsConfig.dynamoDB.tableName,
    hasCredentials: !!(awsConfig.credentials.accessKeyId && awsConfig.credentials.secretAccessKey),
    presignUrl: awsConfig.presignUrl,
  };
}

export { awsConfig, s3Client, ddbClient, lambdaClient };
export default awsConfig;
