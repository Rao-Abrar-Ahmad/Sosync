import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { useColorScheme } from '@/components/useColorScheme';
import { UserProvider, useUser } from '@/context/UserContext';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '@/services/NotificationService';
import { View, Text, StyleSheet } from 'react-native';
import Theme from '@/config/theme';

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
      <RootLayoutNav loaded={loaded} />
    </UserProvider>
  );
}

function RootLayoutNav({ loaded }: { loaded: boolean }) {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthHandler loaded={loaded} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AuthHandler({ loaded }: { loaded: boolean }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const segments: any = useSegments();

  useEffect(() => {

    // console.log('Pathname:', pathname, 'Segments:', segments);
    if (loading) return;

    const inAuthGroup = segments?.includes('(auth)' as any) || pathname.includes('login') || pathname.includes('signup');
    const inOnboardingGroup = segments?.includes('(onboarding)' as any) || pathname.includes('welcome') || pathname.includes('get-started');
    const isBlockedScreen = segments?.includes('blocked' as any) || pathname.includes('blocked');

    if (!user) {
      if (!inAuthGroup && !inOnboardingGroup) {
        // Only redirect if not already in an allowed group
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // Check if account is suspended
      if (user.is_active === false) {
        if (!isBlockedScreen) {
          router.replace('/blocked');
        }
        return;
      }

      // Prevent blocked users from staying on the blocked screen if they are now active
      if (isBlockedScreen && user.is_active === true) {
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
        return;
      }

      // User is logged in and active
      if (user.onboarding_completed === false) {
        // If on welcome or get-started, or not in onboarding at all, move to allow-gps
        const isOnboardingStart = segments.includes('welcome') || segments.includes('get-started');
        if (!inOnboardingGroup || isOnboardingStart) {
          router.replace('/(onboarding)/allow-gps');
        }
      } else {
        // Onboarding is completed, move to main app if still in auth/onboarding groups
        if (inAuthGroup || inOnboardingGroup) {
          if (user.role === 'ADMIN') {
            router.replace('/admin');
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    }
  }, [user, loading, segments, pathname]);

  // Push Notifications Setup
  const pushRegistrationDone = useRef(false);
  useEffect(() => {
    let unsubscribeListeners: (() => void) | undefined;

    if (user && user.onboarding_completed && !pushRegistrationDone.current) {
      // Register for push notifications
      registerForPushNotificationsAsync(user.id || user.uid);
      pushRegistrationDone.current = true;

      // Setup foreground/response listeners
      unsubscribeListeners = setupNotificationListeners();
    }

    return () => {
      if (unsubscribeListeners) unsubscribeListeners();
    };
  }, [user?.uid, user?.onboarding_completed]);

  // Hide splash screen once Firebase is done initializing
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
    };

    const interval = setInterval(checkNetwork, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Prevent UI flash by keeping returning null while loading
  if (loading) return null;

  //console.log(user);
  //console.log('USER ROLE: >>>>', user?.role)

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode: Checking connection...</Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        <Stack.Screen name="admin" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        <Stack.Screen name="report/[id]" options={{ headerShown: false, presentation: 'modal', contentStyle: { backgroundColor: '#fff' } }} />
        <Stack.Screen name="blocked" options={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#333',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40, // Account for status bar
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Theme.typography.inter.medium,
  },
});
