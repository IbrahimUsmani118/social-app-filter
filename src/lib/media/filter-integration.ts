// Filter Integration for Social App
// This file integrates the filter system with the social app's image processing pipeline

import {type PickerImage} from './picker.shared'
import {logger} from '#/logger'
import {msg} from '@lingui/macro'
import {type I18n} from '@lingui/core'

// Import filter system utilities
import { 
  generateFileHash, 
  checkImageUploadLimit, 
  incrementImageUploadCount 
} from '../../../filter-system/getImageUploadCount'
import { 
  uploadImageWithPresignedUrl,
  isPresignedUploadAvailable 
} from '../../../filter-system/presignedUploadService'

export interface FilterResult {
  allowed: boolean
  blocked: boolean
  warning: boolean
  uploadCount: number
  totalCount: number
  message: string
  imageUrl?: string
  fileHash?: string
}

export interface FilterConfig {
  maxUploads: number
  enableDuplicateDetection: boolean
  enablePresignedUpload: boolean
  showWarnings: boolean
}

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  maxUploads: 3,
  enableDuplicateDetection: true,
  enablePresignedUpload: true,
  showWarnings: true,
}

/**
 * Check if an image should be allowed based on filter criteria
 */
export async function checkImageFilter(
  image: PickerImage,
  userId: string,
  config: Partial<FilterConfig> = {}
): Promise<FilterResult> {
  const finalConfig = { ...DEFAULT_FILTER_CONFIG, ...config }
  
  try {
    logger.debug('🔍 [Filter] Checking image filter', {
      userId,
      imageSize: image.size,
      imagePath: image.path.substring(0, 50) + '...',
      config: finalConfig
    })

    // Generate file hash for duplicate detection
    const fileHash = await generateFileHash(image.path)
    
    // Check upload limits
    const limitResult = await checkImageUploadLimit(fileHash, finalConfig.maxUploads)
    
    const result: FilterResult = {
      allowed: !limitResult.blocked,
      blocked: limitResult.blocked,
      warning: limitResult.warning,
      uploadCount: limitResult.count,
      totalCount: limitResult.count,
      message: limitResult.blocked 
        ? `This image has been uploaded ${limitResult.count} times. Maximum allowed: ${finalConfig.maxUploads}.`
        : limitResult.warning
        ? `This image has been uploaded ${limitResult.count} times. One more upload will reach the limit.`
        : 'Image upload allowed.',
      fileHash
    }

    logger.debug('✅ [Filter] Filter check complete', result)
    return result

  } catch (error) {
    logger.error('❌ [Filter] Filter check failed', error)
    
    // On error, allow upload but log the issue
    return {
      allowed: true,
      blocked: false,
      warning: false,
      uploadCount: 0,
      totalCount: 0,
      message: 'Filter check failed, allowing upload.',
      fileHash: undefined
    }
  }
}

/**
 * Process image through filter system before upload
 */
export async function processImageWithFilter(
  image: PickerImage,
  userId: string,
  config: Partial<FilterConfig> = {}
): Promise<{
  image: PickerImage
  filterResult: FilterResult
  shouldProceed: boolean
}> {
  const finalConfig = { ...DEFAULT_FILTER_CONFIG, ...config }
  
  try {
    // Check if presigned upload is available and enabled
    if (finalConfig.enablePresignedUpload && isPresignedUploadAvailable()) {
      logger.debug('🚀 [Filter] Using presigned upload with filtering')
      
      const uploadResult = await uploadImageWithPresignedUrl(
        image.path,
        userId,
        {
          fileName: `image_${Date.now()}.jpg`,
          contentType: image.mime,
          type: image.mime
        }
      )

      const filterResult: FilterResult = {
        allowed: uploadResult.success && !uploadResult.blocked,
        blocked: uploadResult.blocked,
        warning: uploadResult.warning,
        uploadCount: uploadResult.uploadCount,
        totalCount: uploadResult.uploadCount,
        message: uploadResult.success 
          ? 'Image uploaded successfully with filtering.'
          : uploadResult.error || 'Upload failed.',
        imageUrl: uploadResult.imageUrl,
        fileHash: uploadResult.fileHash
      }

      return {
        image: {
          ...image,
          path: uploadResult.imageUrl || image.path
        },
        filterResult,
        shouldProceed: uploadResult.success && !uploadResult.blocked
      }
    }

    // Fallback to regular filter check
    const filterResult = await checkImageFilter(image, userId, finalConfig)
    
    return {
      image,
      filterResult,
      shouldProceed: filterResult.allowed
    }

  } catch (error) {
    logger.error('❌ [Filter] Image processing failed', error)
    
    return {
      image,
      filterResult: {
        allowed: true,
        blocked: false,
        warning: false,
        uploadCount: 0,
        totalCount: 0,
        message: 'Filter processing failed, allowing upload.',
      },
      shouldProceed: true
    }
  }
}

/**
 * Increment upload count after successful upload
 */
export async function recordImageUpload(
  fileHash: string,
  userId: string,
  userName: string,
  fileName: string
): Promise<void> {
  try {
    await incrementImageUploadCount(userId, userName, fileHash, fileName)
    logger.debug('✅ [Filter] Upload count incremented', { fileHash, userId })
  } catch (error) {
    logger.error('❌ [Filter] Failed to increment upload count', error)
    // Don't throw - this is not critical for the upload process
  }
}

/**
 * Get filter configuration from app settings
 */
export function getFilterConfig(): FilterConfig {
  // In a real implementation, this would read from user preferences or app settings
  return DEFAULT_FILTER_CONFIG
}

/**
 * Show filter warning to user
 */
export function showFilterWarning(
  filterResult: FilterResult,
  _: I18n['_']
): void {
  if (filterResult.warning) {
    // Show warning toast
    logger.warn('⚠️ [Filter] Upload warning', filterResult.message)
  }
  
  if (filterResult.blocked) {
    // Show error toast
    logger.error('🚫 [Filter] Upload blocked', filterResult.message)
  }
}

