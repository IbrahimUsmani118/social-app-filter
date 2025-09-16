import {useCallback} from 'react'
import {msg, t} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export type CleanedError = {
  raw: string | undefined
  clean: string | undefined
}

const NETWORK_ERRORS = [
  'Abort',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
]

export function isNetworkError(e: unknown): boolean {
  const str = String(e)
  return NETWORK_ERRORS.some(err => str.includes(err))
}

export function cleanError(str: any): string {
  if (!str) {
    return ''
  }
  if (typeof str !== 'string') {
    str = str.toString()
  }
  
  if (isNetworkError(str)) {
    return t`Unable to connect. Please check your internet connection and try again.`
  }
  
  if (
    str.includes('Upstream Failure') ||
    str.includes('NotEnoughResources') ||
    str.includes('pipethrough network error')
  ) {
    return t`The server appears to be experiencing issues. Please try again in a few moments.`
  }
  
  if (str.includes('Bad token scope') || str.includes('Bad token method')) {
    return t`This feature is not available while using an App Password. Please sign in with your main password.`
  }
  
  if (str.includes('Rate Limit Exceeded')) {
    return t`You've reached the maximum number of requests allowed. Please try again later.`
  }
  
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  
  return str
}

export function useCleanError() {
  const {_} = useLingui()

  return useCallback<(error?: any) => CleanedError>(
    error => {
      if (!error) {
        return {
          raw: undefined,
          clean: undefined,
        }
      }

      const raw = error.toString()
      const clean = cleanError(raw)

      return {
        raw,
        clean: clean !== raw ? clean : undefined,
      }
    },
    [_],
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return cleanError(error.message)
  }
  return cleanError(String(error))
}

export function isRetryableError(error: unknown): boolean {
  const str = String(error)
  return (
    isNetworkError(str) ||
    str.includes('Upstream Failure') ||
    str.includes('NotEnoughResources') ||
    str.includes('pipethrough network error')
  )
}
