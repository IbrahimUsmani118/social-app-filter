import React from 'react'
import {View, ActivityIndicator} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {atoms as a, useTheme} from '#/alf'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'

interface SplashProps {
  isReady: boolean
  children: React.ReactNode
}

export const Splash: React.FC<SplashProps> = ({isReady, children}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (!isReady) {
    return (
      <View style={[a.h_full, a.flex_1, a.justify_center, a.align_center, {backgroundColor: theme.atoms.bg.backgroundColor}]}>
        <View style={[a.justify_center, a.align_center, a.gap_lg]}>
          <Logo width={92} fill="sky" />
          <Logotype width={161} fill={theme.atoms.text.color} />
          <ActivityIndicator size="large" color={theme.atoms.text.color} />
        </View>
        <View style={{height: insets.bottom}} />
      </View>
    )
  }

  return <>{children}</>
}
