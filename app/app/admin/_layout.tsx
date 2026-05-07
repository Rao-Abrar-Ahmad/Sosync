import React from 'react';
import { Stack } from 'expo-router';
import Theme from '@/config/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.variants.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: Theme.typography.inter.bold,
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Admin Dashboard',
          headerShown: true
        }} 
      />
    </Stack>
  );
}
