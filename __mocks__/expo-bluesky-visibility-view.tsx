// Mock for ExpoBlueskyVisibilityView
import React from 'react'
import { View } from 'react-native'

export const ExpoBlueskyVisibilityView = React.forwardRef<
  View,
  {
    children?: React.ReactNode
    onVisibilityChange?: (visible: boolean) => void
    [key: string]: any
  }
>(({ children, onVisibilityChange, ...props }, ref) => {
  return (
    <View ref={ref} {...props}>
      {children}
    </View>
  )
})

export default ExpoBlueskyVisibilityView
