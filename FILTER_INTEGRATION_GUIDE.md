# 🎯 Filter Technology Integration Guide

This guide explains how to integrate the filter technology into the Bluesky social app.

## 📁 Integration Files Created

### Core Integration Files
- `src/lib/media/filter-integration.ts` - Main filter integration logic
- `src/lib/hooks/useImageFilter.ts` - React hook for easy component integration
- `src/lib/media/manip-with-filter.ts` - Enhanced image processing with filtering
- `src/lib/config/filter-config.ts` - Configuration management

### UI Components
- `src/view/com/composer/FilterIntegration.tsx` - Composer filter integration component
- `src/view/com/composer/SelectMediaButtonWithFilter.tsx` - Enhanced media selector with filtering

## 🔧 Integration Points

### 1. **Primary Integration: Image Processing Pipeline**

**Location**: `src/lib/api/index.ts` - `resolveMedia` function

**Current Flow**:
```typescript
// Current code (lines 297-320)
if (embedDraft.media?.type === 'images') {
  const imagesDraft = embedDraft.media.images
  logger.debug(`Uploading images`, { count: imagesDraft.length })
  onStateChange?.(t`Uploading images...`)
  const images: AppBskyEmbedImages.Image[] = await Promise.all(
    imagesDraft.map(async (image, i) => {
      logger.debug(`Compressing image #${i}`)
      const {path, width, height, mime} = await compressImage(image)
      logger.debug(`Uploading image #${i}`)
      const res = await uploadBlob(agent, path, mime)
      return {
        image: res.data.blob,
        alt: image.alt,
        aspectRatio: {width, height},
      }
    }),
  )
  return {
    $type: 'app.bsky.embed.images',
    images,
  }
}
```

**Enhanced Flow**:
```typescript
// Enhanced code with filtering
if (embedDraft.media?.type === 'images') {
  const imagesDraft = embedDraft.media.images
  logger.debug(`Uploading images with filtering`, { count: imagesDraft.length })
  onStateChange?.(t`Processing images with filter...`)
  
  const images: AppBskyEmbedImages.Image[] = await Promise.all(
    imagesDraft.map(async (image, i) => {
      logger.debug(`Processing image #${i} with filter`)
      
      // Apply filter processing
      const {image: processedImage, filterResult, shouldProceed} = 
        await processImageWithCompressionAndFilter(image, userId)
      
      if (!shouldProceed) {
        throw new Error(`Image blocked: ${filterResult.message}`)
      }
      
      logger.debug(`Uploading filtered image #${i}`)
      const res = await uploadBlob(agent, processedImage.path, processedImage.mime)
      
      return {
        image: res.data.blob,
        alt: processedImage.alt,
        aspectRatio: {width: processedImage.width, height: processedImage.height},
      }
    }),
  )
  return {
    $type: 'app.bsky.embed.images',
    images,
  }
}
```

### 2. **Secondary Integration: Composer State Management**

**Location**: `src/view/com/composer/state/composer.ts` - `embed_add_images` action

**Current Flow**:
```typescript
case 'embed_add_images': {
  if (action.images.length === 0) {
    return state
  }
  const prevMedia = state.embed.media
  let nextMedia = prevMedia
  if (!prevMedia) {
    nextMedia = {
      type: 'images',
      images: action.images.slice(0, MAX_IMAGES),
    }
  } else if (prevMedia.type === 'images') {
    nextMedia = {
      ...prevMedia,
      images: [...prevMedia.images, ...action.images].slice(0, MAX_IMAGES),
    }
  }
  return {
    ...state,
    embed: {
      ...state.embed,
      media: nextMedia,
    },
  }
}
```

**Enhanced Flow**:
```typescript
case 'embed_add_images': {
  if (action.images.length === 0) {
    return state
  }
  
  // Filter images before adding to state
  const filteredImages = action.images.filter(img => {
    // Check if image has filter metadata
    if (img.filterResult && !img.filterResult.allowed) {
      // Show warning to user
      Toast.show(img.filterResult.message, { type: 'warning' })
      return false
    }
    return true
  })
  
  if (filteredImages.length === 0) {
    return state
  }
  
  const prevMedia = state.embed.media
  let nextMedia = prevMedia
  if (!prevMedia) {
    nextMedia = {
      type: 'images',
      images: filteredImages.slice(0, MAX_IMAGES),
    }
  } else if (prevMedia.type === 'images') {
    nextMedia = {
      ...prevMedia,
      images: [...prevMedia.images, ...filteredImages].slice(0, MAX_IMAGES),
    }
  }
  return {
    ...state,
    embed: {
      ...state.embed,
      media: nextMedia,
    },
  }
}
```

### 3. **Tertiary Integration: Media Selection**

**Location**: `src/view/com/composer/Composer.tsx` - `onSelectAssets` function

**Current Flow**:
```typescript
const onSelectAssets = useCallback<SelectMediaButtonProps['onSelectAssets']>(
  async ({type, assets, errors}) => {
    setSelectedAssetsType(type)

    if (assets.length) {
      if (type === 'image') {
        const images: ComposerImage[] = []

        await Promise.all(
          assets.map(async image => {
            const composerImage = await createComposerImage({
              path: image.uri,
              width: image.width,
              height: image.height,
              mime: image.mimeType!,
            })
            images.push(composerImage)
          }),
        ).catch(e => {
          logger.error(`createComposerImage failed`, {
            safeMessage: e.message,
          })
        })

        onImageAdd(images)
      } else if (type === 'video') {
        onSelectVideo(post.id, assets[0])
      } else if (type === 'gif') {
        onSelectVideo(post.id, assets[0])
      }
    }

    errors.map(error => {
      Toast.show(error, {
        type: 'warning',
      })
    })
  },
  [post.id, onSelectVideo, onImageAdd],
)
```

**Enhanced Flow**:
```typescript
const onSelectAssets = useCallback<SelectMediaButtonProps['onSelectAssets']>(
  async ({type, assets, errors}) => {
    setSelectedAssetsType(type)

    if (assets.length) {
      if (type === 'image') {
        // Use filter integration
        const {processImages} = useImageFilter({
          userId: session?.did || 'anonymous',
          userName: session?.handle || 'Anonymous',
        })

        await processImages(assets)
      } else if (type === 'video') {
        onSelectVideo(post.id, assets[0])
      } else if (type === 'gif') {
        onSelectVideo(post.id, assets[0])
      }
    }

    errors.map(error => {
      Toast.show(error, {
        type: 'warning',
      })
    })
  },
  [post.id, onSelectVideo, onImageAdd, session],
)
```

## 🚀 Implementation Steps

### Step 1: Install Dependencies
```bash
# In the social-app directory
yarn add @aws-sdk/client-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Step 2: Configure Environment Variables
Create or update your `.env` file:
```bash
# Filter System Configuration
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_S3_BUCKET=your-s3-bucket-name
EXPO_PUBLIC_AWS_ACCESS_KEY_ID=your-access-key-id
EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY=your-secret-access-key
EXPO_PUBLIC_DYNAMODB_TABLE=ImageSignatures
EXPO_PUBLIC_DYNAMODB_REGION=us-east-1

# Filter Settings
EXPO_PUBLIC_MAX_UPLOADS=3
EXPO_PUBLIC_ENABLE_DUPLICATE_DETECTION=true
EXPO_PUBLIC_ENABLE_PRESIGNED_UPLOAD=true
EXPO_PUBLIC_SHOW_FILTER_WARNINGS=true
EXPO_PUBLIC_SIMILARITY_THRESHOLD=25

# API Endpoints
EXPO_PUBLIC_PRESIGN_URL=http://localhost:4000/presigned-url
EXPO_PUBLIC_CHECK_DUPLICATE_URL=http://localhost:4000/check-duplicate
EXPO_PUBLIC_UPLOAD_URL=http://localhost:4000/upload
```

### Step 3: Update Composer Component
Replace the existing `SelectMediaButton` with `SelectMediaButtonWithFilter`:

```typescript
// In src/view/com/composer/Composer.tsx
import {SelectMediaButtonWithFilter} from './SelectMediaButtonWithFilter'

// Replace SelectMediaButton with SelectMediaButtonWithFilter
<SelectMediaButtonWithFilter
  disabled={disabled}
  allowedAssetTypes={allowedAssetTypes}
  selectedAssetsCount={selectedAssetsCount}
  onSelectAssets={onSelectAssets}
  userId={session?.did || 'anonymous'}
  userName={session?.handle || 'Anonymous'}
/>
```

### Step 4: Update Image Processing Pipeline
Modify `src/lib/api/index.ts` to use the enhanced image processing:

```typescript
// Import the enhanced processing function
import {processImageWithCompressionAndFilter} from '#/lib/media/manip-with-filter'

// Update the resolveMedia function
if (embedDraft.media?.type === 'images') {
  const imagesDraft = embedDraft.media.images
  logger.debug(`Uploading images with filtering`, { count: imagesDraft.length })
  onStateChange?.(t`Processing images with filter...`)
  
  const images: AppBskyEmbedImages.Image[] = await Promise.all(
    imagesDraft.map(async (image, i) => {
      const {image: processedImage, shouldProceed} = 
        await processImageWithCompressionAndFilter(image, session?.did || 'anonymous')
      
      if (!shouldProceed) {
        throw new Error('Image blocked by filter')
      }
      
      const res = await uploadBlob(agent, processedImage.path, processedImage.mime)
      return {
        image: res.data.blob,
        alt: processedImage.alt,
        aspectRatio: {width: processedImage.width, height: processedImage.height},
      }
    }),
  )
  return {
    $type: 'app.bsky.embed.images',
    images,
  }
}
```

### Step 5: Start Filter System Server
```bash
# In the filter-system directory
cd filter-system
npm install
npm start
```

## 🧪 Testing the Integration

### Test Image Upload with Filtering
1. Start the filter system server
2. Start the social app
3. Try uploading an image
4. Check the console for filter logs
5. Verify duplicate detection works

### Test Configuration
```typescript
// Test configuration validation
import {validateFilterConfig} from '#/lib/config/filter-config'

const validation = validateFilterConfig()
console.log('Filter config valid:', validation.isValid)
console.log('Errors:', validation.errors)
```

## 🔧 Configuration Options

### Filter Settings
- `maxUploads`: Maximum uploads per image (default: 3)
- `enableDuplicateDetection`: Enable duplicate detection (default: true)
- `enablePresignedUpload`: Use presigned URLs (default: true)
- `showWarnings`: Show warning messages (default: true)
- `similarityThreshold`: Similarity threshold for duplicate detection (default: 25)

### Feature Flags
- `enableImageFiltering`: Master switch for image filtering
- `enableUploadLimits`: Enable upload count limits
- `enableDuplicateDetection`: Enable duplicate detection
- `enablePresignedUploads`: Enable presigned URL uploads

## 🐛 Troubleshooting

### Common Issues
1. **Filter system not starting**: Check AWS credentials and environment variables
2. **Images not being filtered**: Verify feature flags are enabled
3. **Upload errors**: Check filter system server logs
4. **Configuration errors**: Run `validateFilterConfig()` to check settings

### Debug Mode
Enable debug logging by setting:
```bash
EXPO_PUBLIC_DEBUG_FILTER=true
```

## 📊 Monitoring

### Logs to Watch
- Filter processing logs: `🔍 [Filter] Checking image filter`
- Upload count logs: `✅ [Filter] Upload count incremented`
- Error logs: `❌ [Filter] Filter check failed`

### Metrics to Track
- Images processed per day
- Images blocked per day
- Upload count distribution
- Filter processing time

This integration provides a complete image filtering system that prevents duplicate uploads and enforces upload limits while maintaining the existing user experience! 🎉

