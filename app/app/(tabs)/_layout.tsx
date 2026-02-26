import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from 'react-native';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: true,
        header(props) {
          return (
            <View style={{ backgroundColor: '#fff', height: 60, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Header</Text>
            </View>
          )
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 10,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        tabBarActiveBackgroundColor: '#f5f5f5',
        tabBarActiveTintColor: '#000',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color }) => <TabBarIcon name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
