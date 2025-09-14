import {requireNativeModule} from 'expo'

import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

let NativeModule: any
try {
  NativeModule = requireNativeModule('ExpoBlueskyReferrer')
} catch (error) {
  console.warn('ExpoBlueskyReferrer native module not available, using mock')
  NativeModule = {
    getGooglePlayReferrerInfoAsync: async () => null,
    getReferrerInfo: async () => null,
  }
}

export { NativeModule }

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}

export function getReferrerInfo(): Promise<ReferrerInfo | null> {
  return NativeModule.getReferrerInfo()
}
