import {Platform} from 'react-native'
import {requireNativeModule} from 'expo-modules-core'

import {AudioCategory} from './types'

let NativeModule: any
try {
  NativeModule = requireNativeModule('ExpoPlatformInfo')
} catch (error) {
  // Fallback mock for development when native module isn't available
  console.warn('ExpoPlatformInfo native module not available, using mock')
  NativeModule = {
    getIsReducedMotionEnabled: () => false,
    setAudioActive: () => {},
    setAudioCategory: () => {},
  }
}

export function getIsReducedMotionEnabled(): boolean {
  return NativeModule.getIsReducedMotionEnabled()
}

export function setAudioActive(active: boolean): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioActive(active)
}

export function setAudioCategory(audioCategory: AudioCategory): void {
  if (Platform.OS !== 'ios') return
  NativeModule.setAudioCategory(audioCategory)
}
