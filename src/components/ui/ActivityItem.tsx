import { StyleSheet, Text, View } from "react-native";

type Props = {
    title: string;
    subtitle: string;
    isLast?: boolean;
};

export default function ActivityItem({ title, subtitle, isLast }: Props) {
    return (
        <View style={[styles.row, isLast && { marginBottom: 0 }]}>
            {/* Blue bullet dot */}
            <View style={styles.dot} />

            {/* Text content */}
            <View style={styles.textBlock}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 18,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#1565C0",
        marginTop: 6,
        marginRight: 12,
        flexShrink: 0,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 3,
        lineHeight: 18,
    },
});