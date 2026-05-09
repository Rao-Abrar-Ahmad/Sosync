import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { UserProvider } from '@/context/UserContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(onboarding)/welcome',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Geom': require('../assets/fonts/Geom.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // We will hide the splash screen in AuthHandler once Firebase finishes loading
  // useEffect(() => {
  //   if (loaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}

import { useUser } from '@/context/UserContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthHandler />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AuthHandler() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {

    console.log(pathname);
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    //console.log('User inside main layout:', user);
    if (!user) {
      if (!inAuthGroup && !inOnboardingGroup) {
        // Redirect to welcome if not logged in and not in onboarding/auth flow
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // User is logged in
      if (user?.onboarding_completed === false) {
        // If onboarding is not complete, ensure they are in the onboarding flow (but not welcome/get-started)
        if (!inOnboardingGroup || segments[1] === 'welcome' || segments[1] === 'get-started') {
          router.replace('/(onboarding)/allow-gps');
        }
      } else {
        // If onboarding is complete, prevent access to auth and onboarding screens
        if (inAuthGroup || inOnboardingGroup) {
          if (user.role === 'ADMIN') {
            router.replace('/admin' as any);
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    }
  }, [user, loading, segments]);

  // Hide splash screen once Firebase is done initializing
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Prevent UI flash by keeping returning null while loading
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      <Stack.Screen name="admin" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      <Stack.Screen name="report/[id]" options={{ headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: '#fff' } }} />
    </Stack>
  );
}
