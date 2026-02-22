import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import Theme from '@/config/theme';

type props = {
    text: string;
    onPress: () => void;
    type?: 'primary' | 'secondary';
}

const Button = ({ text, onPress, type = 'primary' }: props) => {
    return (
        <TouchableOpacity
            style={[styles.button, type === 'primary' ? styles.buttonPrimary : styles.buttonSecondary]}
            onPress={onPress}
        >
            <Text style={[styles.buttonText, type === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{text}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 12,
        paddingHorizontal: 60,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimary: {
        backgroundColor: Theme.variants.primary,
    },
    buttonSecondary: {
        backgroundColor: Theme.variants.mint,
    },
    buttonText: {
        fontFamily: Theme.typography.bodyBold,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonTextPrimary: {
        color: '#fff',
    },
    buttonTextSecondary: {
        color: '#000',
    },
})

export default Button