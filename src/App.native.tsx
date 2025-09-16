import '#/logger/sentry/setup'
import '#/logger/bitdrift/setup'
import '#/view/icons'

import React, {useEffect} from 'react'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
// StatusBar is now handled by Expo Router in app/_layout.tsx
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as Sentry from '@sentry/react-native'

import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
import {listenSessionDropped} from '#/state/events'
import {beginResolveGeolocationConfig} from '#/state/geolocation'
import * as Toast from '#/view/com/util/Toast'
import {AppProviders} from '#/providers/AppProviders'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

/**
 * Begin geolocation ASAP
 */
beginResolveGeolocationConfig()

export default function App() {
  const {_} = useLingui()
  const [loaded] = useFonts({
    // Add your custom fonts here
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    return listenSessionDropped(() => {
      Toast.show(
        _(msg`Sorry! Your session expired. Please sign in again.`),
        'info',
      )
    })
  }, [_])

  if (!loaded) {
    return null
  }

  // This is now handled by the Expo Router in app/_layout.tsx
  return null
}
