import React from "react";
import {
    View,
    Text,
    Switch,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";

// ─── Types ──────────────────────────────────────────────────────────────────

type IconName = React.ComponentProps<typeof Feather>["name"];

interface BaseProps {
    /** Icon component rendered inside the coloured square */
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
}

interface SwitchRowProps extends BaseProps {
    type: "switch";
    value: boolean;
    onValueChange: (v: boolean) => void;
    trackActiveColor?: string;
}

interface NavRowProps extends BaseProps {
    type: "nav";
    onPress: () => void;
    rightLabel?: string;
}

interface InfoRowProps extends BaseProps {
    type: "info";
    rightLabel?: string;
}

export type SettingRowProps = SwitchRowProps | NavRowProps | InfoRowProps;

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingRow(props: SettingRowProps) {
    const { icon, title, subtitle } = props;

    const inner = (
        <View style={styles.row}>
            <View style={styles.iconSlot}>{icon}</View>

            <View style={styles.textBlock}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
            </View>

            {props.type === "switch" && (
                <Switch
                    value={props.value}
                    onValueChange={props.onValueChange}
                    trackColor={{
                        false: COLORS.border,
                        true: props.trackActiveColor ?? COLORS.primary,
                    }}
                    thumbColor={COLORS.white}
                    ios_backgroundColor={COLORS.border}
                />
            )}

            {props.type === "nav" && (
                props.rightLabel ? (
                    <Text style={styles.rightLabel}>{props.rightLabel}</Text>
                ) : (
                    <Feather
                        name={"chevron-right" as IconName}
                        size={18}
                        color={COLORS.slate400}
                    />
                )
            )}

            {props.type === "info" && props.rightLabel ? (
                <Text style={styles.rightLabel}>{props.rightLabel}</Text>
            ) : null}
        </View>
    );

    if (props.type === "nav") {
        return (
            <TouchableOpacity onPress={props.onPress} activeOpacity={0.7}>
                {inner}
            </TouchableOpacity>
        );
    }

    return inner;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconSlot: {
        marginRight: 12,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.slate800,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    rightLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
});
