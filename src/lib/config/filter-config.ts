// Filter system configuration for the social app
import Constants from 'expo-constants'

export interface FilterSystemConfig {
  // AWS Configuration
  aws: {
    region: string
    bucket: string
    accessKeyId?: string
    secretAccessKey?: string
  }
  
  // DynamoDB Configuration
  dynamodb: {
    tableName: string
    region: string
  }
  
  // Filter Settings
  filter: {
    maxUploads: number
    enableDuplicateDetection: boolean
    enablePresignedUpload: boolean
    showWarnings: boolean
    similarityThreshold: number
  }
  
  // API Endpoints
  api: {
    presignUrl: string
    checkDuplicateUrl: string
    uploadUrl: string
  }
  
  // Feature Flags
  features: {
    enableImageFiltering: boolean
    enableUploadLimits: boolean
    enableDuplicateDetection: boolean
    enablePresignedUploads: boolean
  }
}

// Default configuration
const DEFAULT_CONFIG: FilterSystemConfig = {
  aws: {
    region: 'us-east-1',
    bucket: 'your-s3-bucket-name',
  },
  dynamodb: {
    tableName: 'ImageSignatures',
    region: 'us-east-1',
  },
  filter: {
    maxUploads: 3,
    enableDuplicateDetection: true,
    enablePresignedUpload: true,
    showWarnings: true,
    similarityThreshold: 25,
  },
  api: {
    presignUrl: 'http://localhost:4000/presigned-url',
    checkDuplicateUrl: 'http://localhost:4000/check-duplicate',
    uploadUrl: 'http://localhost:4000/upload',
  },
  features: {
    enableImageFiltering: true,
    enableUploadLimits: true,
    enableDuplicateDetection: true,
    enablePresignedUploads: true,
  },
}

// Get configuration from environment variables
function getConfigFromEnv(): Partial<FilterSystemConfig> {
  const getEnv = (key: string, fallback?: string) =>
    process.env[key] || Constants.expoConfig?.extra?.[key] || fallback

  return {
    aws: {
      region: getEnv('EXPO_PUBLIC_AWS_REGION', DEFAULT_CONFIG.aws.region),
      bucket: getEnv('EXPO_PUBLIC_S3_BUCKET', DEFAULT_CONFIG.aws.bucket),
      accessKeyId: getEnv('EXPO_PUBLIC_AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY'),
    },
    dynamodb: {
      tableName: getEnv('EXPO_PUBLIC_DYNAMODB_TABLE', DEFAULT_CONFIG.dynamodb.tableName),
      region: getEnv('EXPO_PUBLIC_DYNAMODB_REGION', DEFAULT_CONFIG.dynamodb.region),
    },
    filter: {
      maxUploads: parseInt(getEnv('EXPO_PUBLIC_MAX_UPLOADS', '3'), 10),
      enableDuplicateDetection: getEnv('EXPO_PUBLIC_ENABLE_DUPLICATE_DETECTION', 'true') === 'true',
      enablePresignedUpload: getEnv('EXPO_PUBLIC_ENABLE_PRESIGNED_UPLOAD', 'true') === 'true',
      showWarnings: getEnv('EXPO_PUBLIC_SHOW_FILTER_WARNINGS', 'true') === 'true',
      similarityThreshold: parseInt(getEnv('EXPO_PUBLIC_SIMILARITY_THRESHOLD', '25'), 10),
    },
    api: {
      presignUrl: getEnv('EXPO_PUBLIC_PRESIGN_URL', DEFAULT_CONFIG.api.presignUrl),
      checkDuplicateUrl: getEnv('EXPO_PUBLIC_CHECK_DUPLICATE_URL', DEFAULT_CONFIG.api.checkDuplicateUrl),
      uploadUrl: getEnv('EXPO_PUBLIC_UPLOAD_URL', DEFAULT_CONFIG.api.uploadUrl),
    },
    features: {
      enableImageFiltering: getEnv('EXPO_PUBLIC_ENABLE_IMAGE_FILTERING', 'true') === 'true',
      enableUploadLimits: getEnv('EXPO_PUBLIC_ENABLE_UPLOAD_LIMITS', 'true') === 'true',
      enableDuplicateDetection: getEnv('EXPO_PUBLIC_ENABLE_DUPLICATE_DETECTION', 'true') === 'true',
      enablePresignedUploads: getEnv('EXPO_PUBLIC_ENABLE_PRESIGNED_UPLOADS', 'true') === 'true',
    },
  }
}

// Merge default config with environment config
export const filterConfig: FilterSystemConfig = {
  ...DEFAULT_CONFIG,
  ...getConfigFromEnv(),
}

// Validation function
export function validateFilterConfig(): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!filterConfig.aws.bucket || filterConfig.aws.bucket === 'your-s3-bucket-name') {
    errors.push('AWS S3 bucket is not configured')
  }
  
  if (!filterConfig.dynamodb.tableName || filterConfig.dynamodb.tableName === 'YOUR_DYNAMODB_TABLE') {
    errors.push('DynamoDB table name is not configured')
  }
  
  if (filterConfig.filter.maxUploads < 1 || filterConfig.filter.maxUploads > 10) {
    errors.push('Max uploads must be between 1 and 10')
  }
  
  if (filterConfig.filter.similarityThreshold < 1 || filterConfig.filter.similarityThreshold > 100) {
    errors.push('Similarity threshold must be between 1 and 100')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Check if filter system is enabled
export function isFilterSystemEnabled(): boolean {
  return filterConfig.features.enableImageFiltering
}

// Check if specific features are enabled
export function isFeatureEnabled(feature: keyof FilterSystemConfig['features']): boolean {
  return filterConfig.features[feature]
}

// Get filter settings for a specific user (could be extended for user-specific settings)
export function getFilterSettingsForUser(_userId: string) {
  return {
    maxUploads: filterConfig.filter.maxUploads,
    enableDuplicateDetection: filterConfig.filter.enableDuplicateDetection,
    enablePresignedUpload: filterConfig.filter.enablePresignedUpload,
    showWarnings: filterConfig.filter.showWarnings,
    similarityThreshold: filterConfig.filter.similarityThreshold,
  }
}

