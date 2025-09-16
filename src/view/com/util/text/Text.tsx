// Re-export the new Text component from Typography
export {Text, type TextProps} from '#/components/Typography'

// Legacy type for backward compatibility
export type CustomTextProps = {
  type?: string
  lineHeight?: number
  title?: string
  dataSet?: Record<string, string | number>
  selectable?: boolean
  emoji?: boolean
  children?: React.ReactNode
  style?: any
}
