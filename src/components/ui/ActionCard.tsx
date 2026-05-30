import { COLORS } from "@/theme/colors";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
};

export default function ActionCard({ icon, title, subtitle, onPress }: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.card}
        >
            <Feather name={icon} size={36} color={COLORS.primary} />

            <Text style={styles.title}>{title}</Text>

            <Text style={styles.subtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingVertical: 28,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.primary,
        marginTop: 14,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        textAlign: "center",
        marginTop: 6,
        lineHeight: 20,
    },
});