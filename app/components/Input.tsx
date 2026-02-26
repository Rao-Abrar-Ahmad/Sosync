// create a component which extend the textinput component
// and add the theme colors to it
import { TextInput, TextInputProps } from 'react-native';
import Theme from '@/config/theme';

export default function Input(props: TextInputProps) {
    return (
        <TextInput
            {...props}
            style={[
                props.style,
                {
                    fontFamily: Theme.typography.inter.regular,
                    borderWidth: 1,
                    borderColor: Theme.variants.border,
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 14,
                },
            ]}
        />
    );
}