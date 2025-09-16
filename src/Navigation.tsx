import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { Platform, View, Text } from 'react-native'

import { type BottomTabNavigatorParams, type AllNavigatorParams } from '#/lib/routes/types'
import { HomeScreen } from '#/view/screens/Home'
import { SearchScreen } from '#/screens/Search'
import { MessagesInboxScreen } from '#/screens/Messages/Inbox'
import { NotificationsActivityListScreen } from '#/screens/Notifications/ActivityList'
import { ProfileSearchScreen } from '#/screens/Profile/ProfileSearch'
import { Login } from '#/screens/Login'

// Create navigators
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()
const Stack = createNativeStackNavigator<AllNavigatorParams>()
const Drawer = createDrawerNavigator()

// Simple icon components
function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🏠</Text>
    </View>
  )
}

function SearchIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🔍</Text>
    </View>
  )
}

function MessageIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>💬</Text>
    </View>
  )
}

function NotificationIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🔔</Text>
    </View>
  )
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>👤</Text>
    </View>
  )
}

// Wrapper components to handle prop compatibility
function HomeScreenWrapper() {
  return <HomeScreen route={{ name: 'Home', params: {} } as any} navigation={{} as any} />
}

function SearchScreenWrapper() {
  return <SearchScreen route={{ name: 'Search', params: {} } as any} navigation={{} as any} />
}

function MessagesScreenWrapper() {
  return <MessagesInboxScreen route={{ name: 'MessagesInbox', params: {} } as any} navigation={{} as any} />
}

function NotificationsScreenWrapper() {
  return <NotificationsActivityListScreen route={{ name: 'NotificationsActivityList', params: { posts: '' } } as any} navigation={{} as any} />
}

function ProfileScreenWrapper() {
  return <ProfileSearchScreen route={{ name: 'ProfileSearch', params: {} } as any} navigation={{} as any} />
}

function LoginScreenWrapper() {
  return <Login onPressBack={() => {}} />
}

// TabsNavigator component
export function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreenWrapper}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreenWrapper}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreenWrapper}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreenWrapper}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <NotificationIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyProfileTab"
        component={ProfileScreenWrapper}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

// FlatNavigator for web
export function FlatNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreenWrapper} />
      <Stack.Screen name="Search" component={SearchScreenWrapper} />
      <Stack.Screen name="Messages" component={MessagesScreenWrapper} />
      <Stack.Screen name="Notifications" component={NotificationsScreenWrapper} />
      <Stack.Screen name="Profile" component={ProfileScreenWrapper} />
    </Stack.Navigator>
  )
}

// RoutesContainer component
export function RoutesContainer({ children }: { children: React.ReactNode }) {
  return (
    <NavigationContainer>
      {children}
    </NavigationContainer>
  )
}

// Navigation utility functions
export function navigate(routeName: string, params?: any) {
  // This would typically use a navigation ref
  console.log('Navigate to:', routeName, params)
}

export function resetToTab(tabName: string) {
  // This would typically reset navigation to a specific tab
  console.log('Reset to tab:', tabName)
}
