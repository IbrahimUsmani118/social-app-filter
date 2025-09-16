import React from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {RootSiblingParent} from 'react-native-root-siblings'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'

import {KeyboardControllerProvider} from '#/lib/hooks/useEnableKeyboardController'
import {Provider as HideBottomBarBorderProvider} from '#/lib/hooks/useHideBottomBarBorder'
import {QueryProvider} from '#/lib/react-query'
import {Provider as StatsigProvider, tryFetchGates} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {ThemeProvider} from '#/lib/ThemeContext'
import I18nProvider from '#/locale/i18nProvider'
import {isAndroid, isIOS} from '#/platform/detection'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as AgeAssuranceProvider} from '#/state/ageAssurance'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {Provider as EmailVerificationProvider} from '#/state/email-verification'
import {
  beginResolveGeolocationConfig,
  ensureGeolocationConfigIsResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'
import {GlobalGestureEventsProvider} from '#/state/global-gesture-events'
import {Provider as HomeBadgeProvider} from '#/state/home-badge'
import {Provider as InvitesStateProvider} from '#/state/invites'
import {Provider as LightboxStateProvider} from '#/state/lightbox'
import {MessagesProvider} from '#/state/messages'
import {Provider as ModalStateProvider} from '#/state/modals'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as PrefsStateProvider} from '#/state/preferences'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread'
import {Provider as ServiceAccountManager} from '#/state/service-config'
import {
  Provider as SessionProvider,
  type SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'
import {readLastActiveAccount} from '#/state/session/util'
import {Provider as ShellStateProvider} from '#/state/shell'
import {Provider as ComposerProvider} from '#/state/shell/composer'
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import {TestCtrls} from '#/view/com/testing/TestCtrls'
import * as Toast from '#/view/com/util/Toast'
import {Shell} from '#/view/shell'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as PolicyUpdateOverlayProvider} from '#/components/PolicyUpdateOverlay'
import {Provider as PortalProvider} from '#/components/Portal'
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {ToastOutlet} from '#/components/Toast'
import {Splash} from '#/Splash'
// Note: These modules may not be available in all environments
// import {BottomSheetProvider} from '../modules/bottom-sheet'
// import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

// Core providers that don't depend on session state
const CoreProviders: React.FC<{children: React.ReactNode}> = ({children}) => (
  <GeolocationProvider>
    <A11yProvider>
      <KeyboardControllerProvider>
        <SessionProvider>
          <PrefsStateProvider>
            <I18nProvider>
              <ShellStateProvider>
                <InvitesStateProvider>
                  <ModalStateProvider>
                    <DialogStateProvider>
                      <LightboxStateProvider>
                        <PortalProvider>
                          <StarterPackProvider>
                            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                              {children}
                            </SafeAreaProvider>
                          </StarterPackProvider>
                        </PortalProvider>
                      </LightboxStateProvider>
                    </DialogStateProvider>
                  </ModalStateProvider>
                </InvitesStateProvider>
              </ShellStateProvider>
            </I18nProvider>
          </PrefsStateProvider>
        </SessionProvider>
      </KeyboardControllerProvider>
    </A11yProvider>
  </GeolocationProvider>
)

// Session-dependent providers
const SessionProviders: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isReady, setIsReady] = React.useState(false)
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const theme = useColorModeTheme()
  const hasCheckedReferrer = useStarterPackEntry()

  // Initialize session
  React.useEffect(() => {
    async function onLaunch(account?: SessionAccount) {
      try {
        if (account) {
          await resumeSession(account)
        } else {
          await tryFetchGates(undefined, 'prefer-fresh-gates')
        }
      } catch (e) {
        console.error('Session resume failed', e)
      } finally {
        setIsReady(true)
      }
    }
    const account = readLastActiveAccount()
    onLaunch(account)
  }, [resumeSession])

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <Splash isReady={isReady && hasCheckedReferrer}>
            <RootSiblingParent>
              <VideoVolumeProvider>
                <React.Fragment key={currentAccount?.did}>
                  <QueryProvider currentDid={currentAccount?.did}>
                    <PolicyUpdateOverlayProvider>
                      <StatsigProvider>
                        <AgeAssuranceProvider>
                          <ComposerProvider>
                            <MessagesProvider>
                              <LabelDefsProvider>
                                <ModerationOptsProvider>
                                  <LoggedOutViewProvider>
                                    <SelectedFeedProvider>
                                      <HiddenRepliesProvider>
                                        <HomeBadgeProvider>
                                          <UnreadNotifsProvider>
                                            <MutedThreadsProvider>
                                                <ProgressGuideProvider>
                                                  <ServiceAccountManager>
                                                    <EmailVerificationProvider>
                                                      <HideBottomBarBorderProvider>
                                                        <GestureHandlerRootView style={s.h100pct}>
                                                          <GlobalGestureEventsProvider>
                                                            <IntentDialogProvider>
                                                              <TestCtrls />
                                                              <Shell />
                                                              <NuxDialogs />
                                                              <ToastOutlet />
                                                            </IntentDialogProvider>
                                                          </GlobalGestureEventsProvider>
                                                        </GestureHandlerRootView>
                                                      </HideBottomBarBorderProvider>
                                                    </EmailVerificationProvider>
                                                  </ServiceAccountManager>
                                                </ProgressGuideProvider>
                                            </MutedThreadsProvider>
                                          </UnreadNotifsProvider>
                                        </HomeBadgeProvider>
                                      </HiddenRepliesProvider>
                                    </SelectedFeedProvider>
                                  </LoggedOutViewProvider>
                                </ModerationOptsProvider>
                              </LabelDefsProvider>
                            </MessagesProvider>
                          </ComposerProvider>
                        </AgeAssuranceProvider>
                      </StatsigProvider>
                    </PolicyUpdateOverlayProvider>
                  </QueryProvider>
                </React.Fragment>
              </VideoVolumeProvider>
            </RootSiblingParent>
          </Splash>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

// Main app providers
export const AppProviders: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const [isReady, setReady] = React.useState(false)

  React.useEffect(() => {
    Promise.all([
      initPersistedState(),
      ensureGeolocationConfigIsResolved(),
    ]).then(() => setReady(true))
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <CoreProviders>
      <SessionProviders>
        {children}
      </SessionProviders>
    </CoreProviders>
  )
}
