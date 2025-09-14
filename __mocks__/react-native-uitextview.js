import React from 'react'
import { Text } from 'react-native'

// Mock implementation of UITextView for web builds
// This provides a fallback that renders as a regular Text component
export const UITextView = React.forwardRef((props, ref) => {
  const { children, ...textProps } = props
  
  return (
    <Text ref={ref} {...textProps}>
      {children}
    </Text>
  )
})

UITextView.displayName = 'UITextView'

// Export default as well for compatibility
export default UITextView
