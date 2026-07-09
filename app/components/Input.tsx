// create a component which extend the textinput component
// and add the theme colors to it
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import Theme from '@/config/theme';
import { useState } from 'react';

export default function Input(props: TextInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <TextInput
            {...props}
            style={[
                props.style,
                isFocused ? styles.inputFocused : styles.inputBlur,
                {
                    fontFamily: Theme.typography.inter.regular,
                    borderWidth: 1,
                    borderColor: Theme.variants.border,
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 14,
                    color: '#000'
                },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    // Style applied when NOT focused
    inputBlur: {
        borderColor: '#E2E8F0',
        color: '#000'
    },
    // Style applied WHEN focused
    inputFocused: {
        borderColor: '#3B82F6', // Your active focus color,
        color: '#000'
    },
});