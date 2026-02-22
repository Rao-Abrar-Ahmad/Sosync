import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '@/config/theme';
import Button from '@/components/Button';

export default function GetStartedScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={Theme.backgrounds.mainScreen as any}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Crowdsourced</Text>
                    <Text style={styles.title}>Disaster Alert & Safety App</Text>
                </View>

                <Button text="Get Started" type="secondary" onPress={() => router.push('/(auth)/login')} />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    logoContainer: {
        marginTop: 40,
    },
    logo: {
        width: 150,
        height: 150,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontFamily: Theme.typography.primary,
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.variants.text,
        textAlign: 'center',
        marginBottom: 10,
    }
});
