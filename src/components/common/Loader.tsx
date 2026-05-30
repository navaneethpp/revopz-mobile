import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export interface LoaderProps {
    /** Text displayed below the spinner. Defaults to "Loading…" */
    message?: string;
    /** Spinner colour. Defaults to the REVOPZ brand blue. */
    color?: string;
}

/**
 * Centred full-area loading spinner with an optional descriptive message.
 *
 * @example
 * {loading && <Loader message="Loading activity history..." />}
 */
export default function Loader({
    message = "Loading…",
    color = "#1565C0",
}: LoaderProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={color} />
            {message ? <Text style={styles.text}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
    text: {
        fontSize: 15,
        color: "#64748B",
        marginTop: 12,
        fontWeight: "500",
    },
});
