// Enhanced image manipulation with filter integration
// This extends the existing manip.ts with filter functionality

import {type PickerImage} from './picker.shared'
import {compressIfNeeded} from './manip'
import {processImageWithFilter, type FilterResult} from './filter-integration'
import {logger} from '#/logger'

export interface ProcessedImageWithFilter {
  image: PickerImage
  filterResult: FilterResult
  shouldProceed: boolean
}

/**
 * Enhanced image processing that includes filtering
 */
export async function processImageWithCompressionAndFilter(
  image: PickerImage,
  userId: string,
  maxSize?: number
): Promise<ProcessedImageWithFilter> {
  try {
    logger.debug('🔄 [manip-with-filter] Processing image with compression and filter', {
      userId,
      imageSize: image.size,
      maxSize
    })

    // Step 1: Apply filter first
    const filterResult = await processImageWithFilter(image, userId)
    
    if (!filterResult.shouldProceed) {
      logger.warn('🚫 [manip-with-filter] Image blocked by filter', {
        blocked: filterResult.filterResult.blocked,
        message: filterResult.filterResult.message
      })
      
      return {
        image: filterResult.image,
        filterResult: filterResult.filterResult,
        shouldProceed: false
      }
    }

    // Step 2: Apply compression if needed
    const compressedImage = await compressIfNeeded(filterResult.image, maxSize)
    
    logger.debug('✅ [manip-with-filter] Image processing complete', {
      originalSize: image.size,
      compressedSize: compressedImage.size,
      filterAllowed: filterResult.filterResult.allowed
    })

    return {
      image: compressedImage,
      filterResult: filterResult.filterResult,
      shouldProceed: true
    }

  } catch (error) {
    logger.error('❌ [manip-with-filter] Image processing failed', error)
    
    // Fallback to regular compression without filtering
    const compressedImage = await compressIfNeeded(image, maxSize)
    
    return {
      image: compressedImage,
      filterResult: {
        allowed: true,
        blocked: false,
        warning: false,
        uploadCount: 0,
        totalCount: 0,
        message: 'Filter processing failed, using regular compression.',
      },
      shouldProceed: true
    }
  }
}

/**
 * Batch process multiple images with filtering
 */
export async function processImagesWithFilter(
  images: PickerImage[],
  userId: string,
  maxSize?: number
): Promise<ProcessedImageWithFilter[]> {
  logger.debug('🔄 [manip-with-filter] Processing batch of images', {
    count: images.length,
    userId
  })

  const results = await Promise.all(
    images.map(image => 
      processImageWithCompressionAndFilter(image, userId, maxSize)
    )
  )

  const allowedCount = results.filter(r => r.shouldProceed).length
  const blockedCount = results.filter(r => !r.shouldProceed).length

  logger.debug('✅ [manip-with-filter] Batch processing complete', {
    total: images.length,
    allowed: allowedCount,
    blocked: blockedCount
  })

  return results
}

