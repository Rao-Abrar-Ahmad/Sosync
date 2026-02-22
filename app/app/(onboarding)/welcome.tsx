import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/config/theme';

export default function WelcomeScreen() {
    const router = useRouter();
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start();

        // Auto-redirect after 3 seconds
        const timer = setTimeout(() => {
            router.replace('/(onboarding)/get-started');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={Theme.backgrounds.mainScreen as any}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View style={{ opacity: fadeAnim }}>
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
});
