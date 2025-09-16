import React, {Component, ReactNode} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'
import {getErrorMessage, isRetryableError} from '#/lib/error-handling'
import {logger} from '#/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class MessagingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('MessagingErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    this.setState({
      error,
      errorInfo,
    })

    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <MessagingErrorFallback 
        error={this.state.error} 
        onRetry={this.handleRetry}
        isRetryable={this.state.error ? isRetryableError(this.state.error) : false}
      />
    }

    return this.props.children
  }
}

interface FallbackProps {
  error: Error | null
  onRetry: () => void
  isRetryable: boolean
}

function MessagingErrorFallback({error, onRetry, isRetryable}: FallbackProps) {
  const {_} = useLingui()
  const t = useTheme()
  const errorMessage = error ? getErrorMessage(error) : 'An unknown error occurred'

  return (
    <View style={[
      a.flex_1,
      a.justify_center,
      a.align_center,
      a.p_md,
      t.atoms.bg
    ]}>
      <View style={[a.gap_md, a.align_center]}>
        <Text style={[a.text_lg, a.text_center, t.atoms.text_contrast_high]}>
          {_(msg`Something went wrong with messaging`)}
        </Text>
        
        <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_medium]}>
          {errorMessage}
        </Text>

        {isRetryable && (
          <Button
            label={_(msg`Try Again`)}
            onPress={onRetry}
            variant="solid"
            color="primary">
            <Text>{_(msg`Try Again`)}</Text>
          </Button>
        )}

        <Button
          label={_(msg`Report Issue`)}
          onPress={() => {
            // TODO: Implement issue reporting
            logger.info('User requested to report messaging issue', {
              error: error?.message,
              stack: error?.stack,
            })
          }}
          variant="outline"
          color="secondary">
          <Text>{_(msg`Report Issue`)}</Text>
        </Button>
      </View>
    </View>
  )
}
