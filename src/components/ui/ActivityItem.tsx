import { StyleSheet, Text, View } from "react-native";

type Props = {
    title: string;
    subtitle: string;
    isLast?: boolean;
};

export default function ActivityItem({ title, subtitle, isLast }: Props) {
    return (
        <View style={[styles.row, isLast && { marginBottom: 0 }]}>
            {/* Timeline Column */}
            <View style={styles.timelineCol}>
                <View style={styles.dot} />
                {!isLast && <View style={styles.line} />}
            </View>

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
    timelineCol: {
        width: 8,
        marginRight: 12,
        alignItems: "center",
        alignSelf: "stretch",
        position: "relative",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#111827",
        marginTop: 6,
        flexShrink: 0,
    },
    line: {
        position: "absolute",
        top: 14,
        bottom: -14, // stops before the next dot to leave a small gap
        width: 1.5,
        backgroundColor: "#CBD5E1",
        left: 3.25, // center of the 8px wide column ((8 - 1.5) / 2)
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