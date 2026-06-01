import { COLORS } from "@/theme/colors";
import React, { useState } from "react";
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomInputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function CustomInput({
    label,
    error,
    secureTextEntry,
    ...props
}: CustomInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] =
        useState(false);

    return (
        <View style={styles.container}>
            {label ? (
                <Text style={styles.label}>
                    {label}
                </Text>
            ) : null}

            <View style={[
                styles.inputWrapper,
                props.editable === false && styles.inputWrapperDisabled
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        props.editable === false && styles.inputDisabled
                    ]}
                    placeholderTextColor={COLORS.gray400}
                    secureTextEntry={
                        secureTextEntry && !isPasswordVisible
                    }
                    {...props}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() =>
                            setIsPasswordVisible(!isPasswordVisible)
                        }
                    >
                        <Ionicons
                            name={
                                isPasswordVisible
                                    ? "eye-outline"
                                    : "eye-off-outline"
                            }
                            size={22}
                            color={COLORS.gray500}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },

    label: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 8,
    },

    inputWrapper: {
        height: 56,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },

    inputWrapperDisabled: {
        backgroundColor: COLORS.gray50,
        borderColor: COLORS.gray200,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.primary,
    },

    inputDisabled: {
        color: COLORS.gray500,
    },

    errorText: {
        color: COLORS.red500,
        fontSize: 12,
        marginTop: 6,
    },
});