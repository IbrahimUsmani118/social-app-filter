// Enhanced SelectMediaButton with filter integration
import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {type ImagePickerAsset} from 'expo-image-picker'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE} from '#/lib/constants'
import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {openUnifiedPicker} from '#/lib/media/picker'
import {extractDataUriMime} from '#/lib/media/util'
import {isNative, isWeb} from '#/platform/detection'
import {MAX_IMAGES} from '#/view/com/composer/state/composer'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import * as toast from '#/components/Toast'
import {FilterIntegration} from './FilterIntegration'

export type SelectMediaButtonWithFilterProps = {
  disabled?: boolean
  allowedAssetTypes: 'video' | 'image' | 'gif' | undefined
  selectedAssetsCount: number
  onSelectAssets: (props: {
    type: 'video' | 'image' | 'gif'
    assets: ImagePickerAsset[]
    errors: string[]
  }) => void
  userId: string
  userName?: string
}

export function SelectMediaButtonWithFilter({
  disabled,
  allowedAssetTypes,
  selectedAssetsCount,
  onSelectAssets,
  userId,
  userName,
}: SelectMediaButtonWithFilterProps) {
  const {_} = useLingui()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()
  const requestPhotoAccessIfNeeded = usePhotoLibraryPermission()
  const requestVideoAccessIfNeeded = useVideoLibraryPermission()

  const selectionCountRemaining = MAX_IMAGES - selectedAssetsCount

  const processSelectedAssets = useCallback(
    async (rawAssets: ImagePickerAsset[]) => {
      const {
        type,
        assets,
        errors: errorCodes,
      } = await processImagePickerAssets(rawAssets, {
        selectionCountRemaining,
        allowedAssetTypes,
      })

      const errors = errorCodes.map(error => {
        return {
          [VIDEO_MAX_DURATION_MS]: _(
            msg`Video must be shorter than ${VIDEO_MAX_DURATION_MS / 1000} seconds`,
          ),
          [VIDEO_MAX_SIZE]: _(
            msg`Video must be smaller than ${VIDEO_MAX_SIZE / 1024 / 1024}MB`,
          ),
          [VIDEO_MAX_DURATION_MS]: _(
            msg`Video must be shorter than ${VIDEO_MAX_DURATION_MS / 1000} seconds`,
          ),
          [VIDEO_MAX_SIZE]: _(
            msg`Video must be smaller than ${VIDEO_MAX_SIZE / 1024 / 1024}MB`,
          ),
        }[error]
      })

      onSelectAssets({
        type,
        assets,
        errors,
      })
    },
    [_, onSelectAssets, selectionCountRemaining, allowedAssetTypes],
  )

  const onPressSelectMedia = useCallback(async () => {
    if (isNative) {
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        toast.show(_(msg`You need to allow access to your media library.`), {
          type: 'error',
        })
        return
      }
    }

    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    const {assets, canceled} = await sheetWrapper(
      openUnifiedPicker({selectionCountRemaining}),
    )

    if (canceled) return

    await processSelectedAssets(assets)
  }, [
    _,
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    sheetWrapper,
    processSelectedAssets,
    selectionCountRemaining,
  ])

  return (
    <FilterIntegration
      userId={userId}
      userName={userName}
      onImagesProcessed={(images, blockedCount) => {
        // Convert ComposerImage back to ImagePickerAsset format
        const assets: ImagePickerAsset[] = images.map(img => ({
          uri: img.path,
          width: img.width,
          height: img.height,
          mimeType: img.mime,
          assetId: img.source.id,
          fileName: `image_${Date.now()}.jpg`,
          fileSize: img.size,
          type: 'image',
        }))

        const errors: string[] = []
        if (blockedCount > 0) {
          errors.push(
            _(msg`${blockedCount} image(s) were blocked due to upload limits.`)
          )
        }

        onSelectAssets({
          type: 'image',
          assets,
          errors,
        })
      }}
      onError={(error) => {
        toast.show(error, { type: 'error' })
      }}
    >
      {({processImages, isProcessing}) => (
        <Button
          testID="openMediaBtn"
          label={_(
            msg`Add media${selectedAssetsCount > 0 ? ` (${selectedAssetsCount})` : ''}`,
          )}
          size="small"
          variant="ghost"
          color="secondary"
          disabled={disabled || isProcessing}
          onPress={onPressSelectMedia}
          style={[
            a.rounded_full,
            a.px_md,
            a.py_sm,
            t.atoms.bg_contrast_25,
          ]}
          leftIcon={isProcessing ? undefined : ImageIcon}>
          {isProcessing ? _(msg`Processing...`) : undefined}
        </Button>
      )}
    </FilterIntegration>
  )
}

// Helper function from original SelectMediaButton
async function processImagePickerAssets(
  assets: ImagePickerAsset[],
  {
    selectionCountRemaining,
    allowedAssetTypes,
  }: {
    selectionCountRemaining: number
    allowedAssetTypes: 'video' | 'image' | 'gif' | undefined
  },
) {
  const errors: number[] = []
  const processedAssets: ImagePickerAsset[] = []

  for (const asset of assets) {
    if (asset.type === 'video') {
      if (allowedAssetTypes && allowedAssetTypes !== 'video') {
        continue
      }
      if (asset.duration && asset.duration > VIDEO_MAX_DURATION_MS) {
        errors.push(VIDEO_MAX_DURATION_MS)
        continue
      }
      if (asset.fileSize && asset.fileSize > VIDEO_MAX_SIZE) {
        errors.push(VIDEO_MAX_SIZE)
        continue
      }
    } else if (asset.type === 'image') {
      if (allowedAssetTypes && allowedAssetTypes !== 'image') {
        continue
      }
    }

    processedAssets.push(asset)
  }

  const type = processedAssets[0]?.type || 'image'
  return {
    type,
    assets: processedAssets.slice(0, selectionCountRemaining),
    errors,
  }
}

