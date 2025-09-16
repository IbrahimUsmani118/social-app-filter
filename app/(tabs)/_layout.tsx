import { Tabs } from 'expo-router';
import { useTheme } from '#/alf';
import { View, Text } from 'react-native';

export default function TabLayout() {
  const t = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.palette.primary_500,
        tabBarInactiveTintColor: t.palette.contrast_500,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.atoms.bg.backgroundColor,
          borderTopColor: t.palette.contrast_100,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <NotificationIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

// Simple icon components using Unicode symbols
function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🏠</Text>
    </View>
  );
}

function SearchIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🔍</Text>
    </View>
  );
}

function MessageIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>💬</Text>
    </View>
  );
}

function NotificationIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>🔔</Text>
    </View>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color, fontSize: size * 0.8 }}>👤</Text>
    </View>
  );
}
