// Filter integration component for the composer
import React from 'react'
import {type ImagePickerAsset} from 'expo-image-picker'
import {type ComposerImage, createComposerImage} from '#/state/gallery'
import {useImageFilter} from '#/lib/hooks/useImageFilter'
import {logger} from '#/logger'

export interface FilterIntegrationProps {
  userId: string
  userName?: string
  onImagesProcessed: (images: ComposerImage[], blockedCount: number) => void
  onError: (error: string) => void
  children: (props: {
    processImages: (assets: ImagePickerAsset[]) => Promise<void>
    isProcessing: boolean
    lastFilterResult: any
  }) => React.ReactNode
}

export function FilterIntegration({
  userId,
  userName,
  onImagesProcessed,
  onError,
  children,
}: FilterIntegrationProps) {
  const {
    isProcessing,
    processImage,
    recordUpload,
    lastFilterResult,
  } = useImageFilter({
    userId,
    userName,
    maxUploads: 3,
    enableDuplicateDetection: true,
    enablePresignedUpload: true,
    showWarnings: true,
  })

  const processImages = React.useCallback(
    async (assets: ImagePickerAsset[]) => {
      try {
        logger.debug('🔄 [FilterIntegration] Processing selected images', {
          count: assets.length,
          userId
        })

        const processedImages: ComposerImage[] = []
        let blockedCount = 0

        for (const asset of assets) {
          try {
            // Create composer image from asset
            const composerImage = await createComposerImage({
              path: asset.uri,
              width: asset.width,
              height: asset.height,
              mime: asset.mimeType!,
            })

            // Process through filter
            const result = await processImage(composerImage)

            if (result.shouldProceed) {
              processedImages.push(result.image)
              
              // Record upload if we have a file hash
              if (result.filterResult.fileHash) {
                await recordUpload(
                  result.filterResult.fileHash,
                  `image_${Date.now()}.jpg`
                )
              }
            } else {
              blockedCount++
              logger.warn('🚫 [FilterIntegration] Image blocked', {
                reason: result.filterResult.message,
                uploadCount: result.filterResult.uploadCount
              })
            }
          } catch (error) {
            logger.error('❌ [FilterIntegration] Failed to process image', error)
            // Continue with other images even if one fails
          }
        }

        logger.debug('✅ [FilterIntegration] Image processing complete', {
          processed: processedImages.length,
          blocked: blockedCount,
          total: assets.length
        })

        onImagesProcessed(processedImages, blockedCount)

      } catch (error) {
        logger.error('❌ [FilterIntegration] Image processing failed', error)
        onError('Failed to process images. Please try again.')
      }
    },
    [userId, processImage, recordUpload, onImagesProcessed, onError]
  )

  return (
    <>
      {children({
        processImages,
        isProcessing,
        lastFilterResult,
      })}
    </>
  )
}

