import {type AtpAgent, XRPCError} from '@atproto/api'
import EventEmitter from 'eventemitter3'
import {nanoid} from 'nanoid/non-secure'

import {networkRetry} from '#/lib/async/retry'
import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {isRetryableError, getErrorMessage} from '#/lib/error-handling'
import {Logger} from '#/logger'
import {type MessagesEventBus} from '#/state/messages/events/agent'
import {
  type ConvoEvent,
  type ConvoItem,
  type ConvoParams,
  type ConvoState,
  ConvoStatus,
  ConvoDispatchEvent,
} from './types'

const logger = Logger.create(Logger.Context.DMsAgent)

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
const MAX_PENDING_MESSAGES = 50

export class ImprovedConvo {
  private id: string
  private agent: AtpAgent
  private events: MessagesEventBus
  private senderUserDid: string

  private status: ConvoStatus = ConvoStatus.Uninitialized
  private error: string | undefined
  private oldestRev: string | undefined | null = undefined
  private isFetchingHistory = false
  private latestRev: string | undefined = undefined

  private pastMessages: Map<string, any> = new Map()
  private newMessages: Map<string, any> = new Map()
  private pendingMessages: Map<string, PendingMessage> = new Map()
  private deletedMessages: Set<string> = new Set()

  private isProcessingPendingMessages = false
  private pendingMessageFailure: 'recoverable' | 'unrecoverable' | null = null
  private retryAttempts = 0
  private retryTimeout: NodeJS.Timeout | null = null

  private lastActiveTimestamp: number | undefined
  private emitter = new EventEmitter<{event: [ConvoEvent]}>()

  convoId: string
  convo: any | undefined
  sender: any | undefined
  recipients: any[] | undefined
  snapshot: ConvoState | undefined

  constructor(params: ConvoParams) {
    this.id = nanoid(3)
    this.agent = params.agent
    this.events = params.events
    this.senderUserDid = params.senderUserDid
    this.convoId = params.convoId

    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.events.on('event', this.handleEvent)
  }

  private handleEvent = (event: any) => {
    if (event.type === 'logs') {
      this.handleLogs(event.logs)
    }
  }

  private handleLogs(logs: any[]) {
    for (const log of logs) {
      if (log.convoId === this.convoId) {
        this.processLogEvent(log)
      }
    }
    this.commit()
  }

  private processLogEvent(log: any) {
    // Process different types of log events
    switch (log.type) {
      case 'message':
        this.handleNewMessage(log)
        break
      case 'deleted-message':
        this.handleDeletedMessage(log)
        break
      case 'read-receipt':
        this.handleReadReceipt(log)
        break
      default:
        logger.debug('Unknown log event type', {type: log.type})
    }
  }

  private handleNewMessage(log: any) {
    if (log.message && !this.deletedMessages.has(log.message.id)) {
      this.newMessages.set(log.message.id, log.message)
    }
  }

  private handleDeletedMessage(log: any) {
    if (log.messageId) {
      this.deletedMessages.add(log.messageId)
      this.newMessages.delete(log.messageId)
      this.pastMessages.delete(log.messageId)
    }
  }

  private handleReadReceipt(log: any) {
    // Update read status for messages
    // Implementation depends on your read receipt structure
  }

  async sendMessage(message: any): Promise<void> {
    if (this.status !== ConvoStatus.Ready) {
      throw new Error('Conversation is not ready')
    }

    if (this.pendingMessages.size >= MAX_PENDING_MESSAGES) {
      throw new Error('Too many pending messages')
    }

    const id = nanoid()
    const pendingMessage: PendingMessage = {
      id,
      message,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.pendingMessages.set(id, pendingMessage)
    this.commit()

    // Process pending messages
    this.processPendingMessages()
  }

  async processPendingMessages(): Promise<void> {
    if (this.isProcessingPendingMessages) {
      return
    }

    const pendingMessage = Array.from(this.pendingMessages.values()).shift()
    if (!pendingMessage) {
      this.isProcessingPendingMessages = false
      return
    }

    this.isProcessingPendingMessages = true

    try {
      const response = await this.agent.api.chat.bsky.convo.sendMessage(
        {
          convoId: this.convoId,
          message: pendingMessage.message,
        },
        {encoding: 'application/json', headers: DM_SERVICE_HEADERS},
      )

      const res = response.data

      // Remove from pending and add to new messages
      this.pendingMessages.delete(pendingMessage.id)
      this.newMessages.set(res.id, {
        ...res,
        $type: 'chat.bsky.convo.defs#messageView',
      })

      this.pendingMessageFailure = null
      this.retryAttempts = 0

      this.commit()

      // Continue processing remaining messages
      await this.processPendingMessages()
    } catch (error) {
      await this.handleSendMessageFailure(error, pendingMessage)
    }
  }

  private async handleSendMessageFailure(error: any, pendingMessage: PendingMessage): Promise<void> {
    const errorMessage = getErrorMessage(error)
    const isRetryable = isRetryableError(error)

    logger.warn('Message send failed', {
      error: errorMessage,
      isRetryable,
      retryCount: pendingMessage.retryCount,
    })

    if (isRetryable && pendingMessage.retryCount < MAX_RETRY_ATTEMPTS) {
      // Retry with exponential backoff
      pendingMessage.retryCount++
      this.pendingMessageFailure = 'recoverable'
      
      const delay = RETRY_DELAY_MS * Math.pow(2, pendingMessage.retryCount - 1)
      
      this.retryTimeout = setTimeout(() => {
        this.processPendingMessages()
      }, delay)
    } else {
      // Give up on this message
      this.pendingMessages.delete(pendingMessage.id)
      this.pendingMessageFailure = 'unrecoverable'
      
      this.emitter.emit('event', {
        type: 'message-send-failed',
        messageId: pendingMessage.id,
        error: errorMessage,
      })
    }

    this.commit()
  }

  async retryFailedMessages(): Promise<void> {
    if (this.pendingMessageFailure === 'unrecoverable') {
      return
    }

    // Clear retry timeout if it exists
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    this.pendingMessageFailure = null
    this.retryAttempts = 0

    await this.processPendingMessages()
  }

  private commit() {
    // Update snapshot and emit state change
    this.snapshot = this.getSnapshot()
    this.emitter.emit('event', {
      type: 'state-changed',
      snapshot: this.snapshot,
    })
  }

  private getSnapshot(): ConvoState {
    const items: ConvoItem[] = []

    // Add pending messages first
    for (const pending of this.pendingMessages.values()) {
      items.push({
        type: 'pending-message',
        id: pending.id,
        message: pending.message,
        timestamp: pending.timestamp,
      })
    }

    // Add new messages
    for (const message of this.newMessages.values()) {
      if (!this.deletedMessages.has(message.id)) {
        items.push({
          type: 'message',
          id: message.id,
          message,
        })
      }
    }

    // Add past messages
    for (const message of this.pastMessages.values()) {
      if (!this.deletedMessages.has(message.id)) {
        items.push({
          type: 'message',
          id: message.id,
          message,
        })
      }
    }

    return {
      status: this.status,
      error: this.error,
      items: items.sort((a, b) => {
        const aTime = a.timestamp || 0
        const bTime = b.timestamp || 0
        return aTime - bTime
      }),
      hasMore: this.oldestRev !== null,
      isFetchingHistory: this.isFetchingHistory,
      pendingMessageFailure: this.pendingMessageFailure,
    }
  }

  destroy() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
    this.events.off('event', this.handleEvent)
    this.emitter.removeAllListeners()
  }
}

interface PendingMessage {
  id: string
  message: any
  timestamp: number
  retryCount: number
}
