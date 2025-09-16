import React, {useCallback, useState, useRef, useEffect} from 'react'
import {Pressable, TextInput, useWindowDimensions, View} from 'react-native'
import {
  useFocusedInputHandler,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {
  measure,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Graphemer from 'graphemer'
import {flushSync} from 'react-dom'
import TextareaAutosize from 'react-textarea-autosize'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isIOS, isWeb} from '#/platform/detection'
import {isSafari, isTouchDevice} from '#/lib/browser'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useEmail} from '#/state/email-verification'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {type EmojiPickerPosition} from '#/view/com/composer/text-input/web/EmojiPicker'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import * as Toast from '#/view/com/util/Toast'
import {android, atoms as a, useTheme} from '#/alf'
import {useSharedInputStyles} from '#/components/forms/TextField'
import {Button} from '#/components/Button'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import {useExtractEmbedFromFacets} from './MessageInputEmbed'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export function MessageInput({
  onSendMessage,
  hasEmbed,
  setEmbed,
  children,
  openEmojiPicker,
}: {
  onSendMessage: (message: string) => void
  hasEmbed: boolean
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
  openEmojiPicker?: (pos: EmojiPickerPosition) => void
}) {
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {getDraft, clearDraft} = useMessageDraft()

  // Input layout
  const {top: topInset} = useSafeAreaInsets()
  const {height: windowHeight} = useWindowDimensions()
  const {height: keyboardHeight} = useReanimatedKeyboardAnimation()
  const maxHeight = useSharedValue<undefined | number>(undefined)
  const isInputScrollable = useSharedValue(false)

  const inputStyles = useSharedInputStyles()
  const [isFocused, setIsFocused] = useState(false)
  const [message, setMessage] = useState(getDraft)
  const [shouldEnforceClear, setShouldEnforceClear] = useState(false)

  // Web-specific state
  const isComposing = useRef(false)
  const [isHovered, setIsHovered] = useState(false)
  const [textAreaHeight, setTextAreaHeight] = useState(38)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useAnimatedRef<TextInput>()

  const {needsEmailVerification} = useEmail()

  useSaveMessageDraft(message)
  useExtractEmbedFromFacets(message, setEmbed)

  const onSubmit = useCallback(() => {
    if (needsEmailVerification) {
      return
    }
    if (!hasEmbed && message.trim() === '') {
      return
    }
    if (new Graphemer().countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`), 'xmark')
      return
    }
    clearDraft()
    onSendMessage(message)
    playHaptic()
    setEmbed(undefined)
    setMessage('')
    if (isIOS) {
      setShouldEnforceClear(true)
    }
    if (isWeb) {
      // Pressing the send button causes the text input to lose focus, so we need to
      // re-focus it after sending
      setTimeout(() => {
        if (isWeb) {
          textAreaRef.current?.focus()
        } else {
          inputRef.current?.focus()
        }
      }, 100)
    }
  }, [
    needsEmailVerification,
    hasEmbed,
    message,
    clearDraft,
    onSendMessage,
    playHaptic,
    setEmbed,
    inputRef,
    _,
  ])

  // Web-specific handlers
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Don't submit the form when the Japanese or any other IME is composing
      if (isComposing.current) return

      // see https://github.com/bluesky-social/social-app/issues/4178
      // see https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/
      // see https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
      //
      // On Safari, the final keydown event to dismiss the IME - which is the enter key - is also "Enter" below.
      // Obviously, this causes problems because the final dismissal should _not_ submit the text, but should just
      // stop the IME editing. This is the behavior of Chrome and Firefox, but not Safari.
      //
      // Keycode is deprecated, however the alternative seems to only be to compare the timestamp from the
      // onCompositionEnd event to the timestamp of the keydown event, which is not reliable. For example, this hack
      // uses that method: https://github.com/ProseMirror/prosemirror-view/pull/44. However, from my 500ms resulted in
      // far too long of a delay, and a subsequent enter press would often just end up doing nothing. A shorter time
      // frame was also not great, since it was too short to be reliable (i.e. an older system might have a larger
      // time gap between the two events firing.
      if (isSafari && e.key === 'Enter' && e.keyCode === 229) {
        return
      }

      if (e.key === 'Enter') {
        if (e.shiftKey) return
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
    },
    [],
  )

  const onEmojiInserted = useCallback(
    (emoji: any) => {
      if (!textAreaRef.current) {
        return
      }
      const position = textAreaRef.current.selectionStart ?? 0
      textAreaRef.current.focus()
      flushSync(() => {
        setMessage(
          message =>
            message.slice(0, position) + emoji.native + message.slice(position),
        )
      })
      textAreaRef.current.selectionStart = position + emoji.native.length
      textAreaRef.current.selectionEnd = position + emoji.native.length
    },
    [setMessage],
  )

  useEffect(() => {
    if (isWeb) {
      textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted)
      return () => {
        textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted)
      }
    }
  }, [onEmojiInserted])

  // Native-specific handlers
  useFocusedInputHandler(
    {
      onChangeText: () => {
        'worklet'
        const measurement = measure(inputRef)
        if (!measurement) return

        const max = windowHeight - -keyboardHeight.get() - topInset - 150
        const availableSpace = max - measurement.height

        maxHeight.set(max)
        isInputScrollable.set(availableSpace < 30)
      },
    },
    [windowHeight, topInset],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.get(),
  }))

  const animatedProps = useAnimatedProps(() => ({
    scrollEnabled: isInputScrollable.get(),
  }))

  if (isWeb) {
    return (
      <View style={a.p_sm}>
        {children}
        <View
          style={[
            a.flex_row,
            t.atoms.bg_contrast_25,
            {
              paddingRight: a.p_sm.padding - 2,
              paddingLeft: a.p_sm.padding - 2,
              borderWidth: 1,
              borderRadius: 23,
              borderColor: 'transparent',
              height: textAreaHeight + 23,
            },
            isHovered && inputStyles.chromeHover,
            isFocused && inputStyles.chromeFocus,
          ]}
          // @ts-expect-error web only
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          {openEmojiPicker && (
            <Button
              onPress={e => {
                e.currentTarget.measure((_fx, _fy, _width, _height, px, py) => {
                  openEmojiPicker?.({
                    top: py,
                    left: px,
                    right: px,
                    bottom: py,
                    nextFocusRef:
                      textAreaRef as unknown as React.MutableRefObject<HTMLElement>,
                  })
                })
              }}
              style={[
                a.rounded_full,
                a.overflow_hidden,
                a.align_center,
                a.justify_center,
                {
                  marginTop: 5,
                  height: 30,
                  width: 30,
                },
              ]}
              label={_(msg`Open emoji picker`)}>
              {state => (
                <View
                  style={[
                    a.absolute,
                    a.inset_0,
                    a.align_center,
                    a.justify_center,
                    {
                      backgroundColor:
                        state.hovered || state.focused || state.pressed
                          ? t.atoms.bg.backgroundColor
                          : undefined,
                    },
                  ]}>
                  <EmojiSmile size="lg" />
                </View>
              )}
            </Button>
          )}
          <TextareaAutosize
            ref={textAreaRef}
            style={{
              flex: 1,
              paddingLeft: a.p_sm.padding,
              paddingRight: a.p_sm.padding,
              border: 0,
              color: t.palette.contrast_900,
              paddingTop: 10,
              backgroundColor: 'transparent',
              resize: 'none',
            }}
            maxRows={12}
            placeholder={_(msg`Write a message`)}
            defaultValue=""
            value={message}
            dirName="ltr"
            autoFocus={true}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onCompositionStart={() => {
              isComposing.current = true
            }}
            onCompositionEnd={() => {
              isComposing.current = false
            }}
            onHeightChange={height => setTextAreaHeight(height)}
            onChange={onChange}
            // On mobile web phones, we want to keep the same behavior as the native app. Do not submit the message
            // in these cases.
            onKeyDown={isTouchDevice && isMobile ? undefined : onKeyDown}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={_(msg`Send message`)}
            accessibilityHint=""
            style={[
              a.rounded_full,
              a.align_center,
              a.justify_center,
              {
                height: 30,
                width: 30,
                marginTop: 5,
                backgroundColor: t.palette.primary_500,
              },
            ]}
            onPress={onSubmit}>
            <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
          </Pressable>
        </View>
      </View>
    )
  }

  // Native implementation
  return (
    <View style={[a.px_md, a.pb_sm, a.pt_xs]}>
      {children}
      <View
        style={[
          a.w_full,
          a.flex_row,
          t.atoms.bg_contrast_25,
          {
            padding: a.p_sm.padding - 2,
            paddingLeft: a.p_md.padding - 2,
            borderWidth: 1,
            borderRadius: 23,
            borderColor: 'transparent',
          },
          isFocused && inputStyles.chromeFocus,
        ]}>
        <AnimatedTextInput
          accessibilityLabel={_(msg`Message input field`)}
          accessibilityHint={_(msg`Type your message here`)}
          placeholder={_(msg`Write a message`)}
          placeholderTextColor={t.palette.contrast_500}
          value={message}
          onChange={evt => {
            // bit of a hack: iOS automatically accepts autocomplete suggestions when you tap anywhere on the screen
            // including the button we just pressed - and this overrides clearing the input! so we watch for the
            // next change and double make sure the input is cleared. It should *always* send an onChange event after
            // clearing via setMessage('') that happens in onSubmit()
            // -sfn
            if (isIOS && shouldEnforceClear) {
              setShouldEnforceClear(false)
              setMessage('')
              return
            }
            const text = evt.nativeEvent.text
            setMessage(text)
          }}
          multiline={true}
          style={[
            a.flex_1,
            a.text_md,
            a.px_sm,
            t.atoms.text,
            android({paddingTop: 0}),
            {paddingBottom: isIOS ? 5 : 0},
            animatedStyle,
          ]}
          keyboardAppearance={t.scheme}
          submitBehavior="newline"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          ref={inputRef}
          hitSlop={HITSLOP_10}
          animatedProps={animatedProps}
          editable={!needsEmailVerification}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Send message`)}
          accessibilityHint=""
          hitSlop={HITSLOP_10}
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {height: 30, width: 30, backgroundColor: t.palette.primary_500},
          ]}
          onPress={onSubmit}
          disabled={needsEmailVerification}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}