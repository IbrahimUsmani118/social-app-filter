import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'

import {isTouchDevice} from '#/lib/browser'
import {isNative} from '#/platform/detection'

const DEFAULT_TARGET_SCALE = isNative || isTouchDevice ? 0.98 : 1

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PressableScale({
  targetScale = DEFAULT_TARGET_SCALE,
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: {
  targetScale?: number
  style?: StyleProp<ViewStyle>
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
  const reducedMotion = useReducedMotion()

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    return {
      transform: [{scale: scale.value}],
    }
  })

  console.log('PressableScale render:', { reducedMotion, targetScale })

  const onPressInWorklet = () => {
    'worklet'
    console.log('PressableScale onPressIn worklet called')
    cancelAnimation(scale)
    scale.value = withTiming(targetScale, {duration: 100})
  }

  const onPressOutWorklet = () => {
    'worklet'
    console.log('PressableScale onPressOut worklet called')
    cancelAnimation(scale)
    scale.value = withTiming(1, {duration: 100})
  }

  const onPressInJS = (e: any) => {
    console.log('PressableScale onPressIn called')
    if (onPressIn) {
      onPressIn(e)
    }
  }

  const onPressOutJS = (e: any) => {
    console.log('PressableScale onPressOut called')
    if (onPressOut) {
      onPressOut(e)
    }
  }

  const shouldAnimate = !reducedMotion

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        console.log('AnimatedPressable onPressIn triggered')
        onPressInWorklet()
        runOnJS(onPressInJS)(e)
      }}
      onPressOut={(e) => {
        console.log('AnimatedPressable onPressOut triggered')
        onPressOutWorklet()
        runOnJS(onPressOutJS)(e)
      }}
      onPress={(e) => {
        console.log('AnimatedPressable onPress triggered')
        if (rest.onPress) {
          rest.onPress(e)
        }
      }}
      style={[shouldAnimate && animatedStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  )
}
