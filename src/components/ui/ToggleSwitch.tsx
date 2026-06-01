import { COLORS } from "@/theme/colors";
import { StyleSheet, Switch, Text, View } from "react-native";

interface ToggleSwitchProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export default function ToggleSwitch({
    label,
    value,
    onValueChange,
}: ToggleSwitchProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label}
            </Text>

            <Switch value={value}
                onValueChange={onValueChange}
                trackColor={{
                    false: COLORS.gray300,
                    true: COLORS.blueLink,
                }}
                thumbColor={COLORS.white}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 15,
        color: COLORS.gray700,
        fontWeight: '500',
    }
})