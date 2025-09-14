// Mock for ExpoPlatformInfo native module
// This provides a fallback for development when the native module isn't available

export default {
  getIsReducedMotionEnabled: () => false,
  getIsScreenReaderEnabled: () => false,
  getPlatformInfo: () => ({
    platform: 'ios',
    version: '1.0.0',
    buildNumber: '1',
  }),
}

// Also export as named export for compatibility
export const getIsReducedMotionEnabled = () => false
export const getIsScreenReaderEnabled = () => false
export const getPlatformInfo = () => ({
  platform: 'ios',
  version: '1.0.0',
  buildNumber: '1',
})
