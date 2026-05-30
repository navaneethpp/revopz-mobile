import { COLORS } from "@/theme/colors";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

interface PrimaryButtonProps {
    title: string;
    onPress?: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export default function PrimaryButton({
    title,
    onPress,
    loading = false,
    disabled = false,
}: PrimaryButtonProps) {
    return (
        <TouchableOpacity
            style={
                [styles.button,
                disabled && styles.disabled
                ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.text}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        height: 54,
        borderRadius: 27,
        backgroundColor: COLORS.blueLink,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 12,
    },
    text: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    }
})