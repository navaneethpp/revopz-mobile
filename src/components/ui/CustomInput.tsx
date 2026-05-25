import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface CustomInputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function CustomInput({ label, error, ...props }: CustomInputProps) {
    return (
        <View style={styles.container}>
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}

            <TextInput style={[styles.input, error ? styles.inputError : null,]} {...props} />

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
    },
    input: {
        height: 56,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        fontSize: 16,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputError: {
        borderColor: '#ef4444'
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 6,
    },
})