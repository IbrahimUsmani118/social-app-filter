import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {router} from 'expo-router'

export function useGoBack(onGoBack?: () => unknown) {
  const navigation = useNavigation<NavigationProp>()
  return () => {
    onGoBack?.()
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('HomeTab')
      // Use expo-router to navigate to home
      router.push('/')
    }
  }
}
