// React hook for image filtering integration
import {useCallback, useState} from 'react'
import {type PickerImage} from '#/lib/media/picker.shared'
import {type FilterResult, processImageWithFilter, recordImageUpload} from '#/lib/media/filter-integration'
import {logger} from '#/logger'
import * as toast from '#/components/Toast'

export interface UseImageFilterOptions {
  maxUploads?: number
  enableDuplicateDetection?: boolean
  enablePresignedUpload?: boolean
  showWarnings?: boolean
  userId: string
  userName?: string
}

export interface UseImageFilterReturn {
  isProcessing: boolean
  processImage: (image: PickerImage) => Promise<{
    image: PickerImage
    filterResult: FilterResult
    shouldProceed: boolean
  }>
  recordUpload: (fileHash: string, fileName: string) => Promise<void>
  lastFilterResult: FilterResult | null
}

export function useImageFilter(options: UseImageFilterOptions): UseImageFilterReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastFilterResult, setLastFilterResult] = useState<FilterResult | null>(null)

  const processImage = useCallback(async (image: PickerImage) => {
    setIsProcessing(true)
    
    try {
      logger.debug('🔄 [useImageFilter] Processing image', {
        userId: options.userId,
        imageSize: image.size,
        imagePath: image.path.substring(0, 50) + '...'
      })

      const result = await processImageWithFilter(image, options.userId, {
        maxUploads: options.maxUploads,
        enableDuplicateDetection: options.enableDuplicateDetection,
        enablePresignedUpload: options.enablePresignedUpload,
        showWarnings: options.showWarnings,
      })

      setLastFilterResult(result.filterResult)

      // Show appropriate messages to user
      if (result.filterResult.blocked) {
        toast.show(result.filterResult.message, {
          type: 'error',
        })
      } else if (result.filterResult.warning && options.showWarnings) {
        toast.show(result.filterResult.message, {
          type: 'warning',
        })
      }

      logger.debug('✅ [useImageFilter] Image processing complete', {
        allowed: result.filterResult.allowed,
        blocked: result.filterResult.blocked,
        warning: result.filterResult.warning,
        uploadCount: result.filterResult.uploadCount
      })

      return result

    } catch (error) {
      logger.error('❌ [useImageFilter] Image processing failed', error)
      
      const errorResult: FilterResult = {
        allowed: true,
        blocked: false,
        warning: false,
        uploadCount: 0,
        totalCount: 0,
        message: 'Filter processing failed, allowing upload.',
      }
      
      setLastFilterResult(errorResult)
      
      return {
        image,
        filterResult: errorResult,
        shouldProceed: true
      }
    } finally {
      setIsProcessing(false)
    }
  }, [options])

  const recordUpload = useCallback(async (fileHash: string, fileName: string) => {
    try {
      await recordImageUpload(
        fileHash, 
        options.userId, 
        options.userName || 'Anonymous', 
        fileName
      )
      logger.debug('✅ [useImageFilter] Upload recorded', { fileHash, fileName })
    } catch (error) {
      logger.error('❌ [useImageFilter] Failed to record upload', error)
      // Don't throw - this is not critical
    }
  }, [options.userId, options.userName])

  return {
    isProcessing,
    processImage,
    recordUpload,
    lastFilterResult,
  }
}

