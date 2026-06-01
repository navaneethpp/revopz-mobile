import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "@/theme/colors";
import { Alert } from "@/context/AlertContext";
import CustomInput from "@/components/ui/CustomInput";
import { resetPassword } from "@/services/authService";
import { triggerHaptic } from "@/utils/haptics";
import {
    checkPasswordRequirements,
    isPasswordValid,
} from "@/utils/passwordValidator";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ResetPasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

// ─── Sub-component: single requirement indicator row ─────────────────────────

function RequirementRow({ label, met }: { label: string; met: boolean }) {
    return (
        <View style={styles.reqRow}>
            <Feather
                name={met ? "check-circle" : "circle"}
                size={14}
                color={met ? COLORS.success : COLORS.gray400}
                style={{ marginRight: 8 }}
            />
            <Text style={[styles.reqText, met && styles.reqTextMet]}>
                {label}
            </Text>
        </View>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ResetPasswordModal({
    visible,
    onClose,
}: ResetPasswordModalProps) {
    // Form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        current: "",
        newPassword: "",
        confirm: "",
    });
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Animation refs
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.95)).current;
    const cardTranslateY = useRef(new Animated.Value(20)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    // ── Animations ────────────────────────────────────────────────────────

    const startEntryAnimation = () => {
        backdropOpacity.setValue(0);
        cardScale.setValue(0.95);
        cardTranslateY.setValue(20);
        cardOpacity.setValue(0);

        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                tension: 70,
                friction: 11,
                useNativeDriver: true,
            }),
            Animated.spring(cardTranslateY, {
                toValue: 0,
                tension: 70,
                friction: 11,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const startExitAnimation = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(cardScale, {
                toValue: 0.95,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(cardTranslateY, {
                toValue: 15,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(callback);
    };

    // ── Helpers ───────────────────────────────────────────────────────────

    const resetForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setLoading(false);
        setErrors({ current: "", newPassword: "", confirm: "" });
    };

    const handleClose = () => {
        if (loading) return;
        startExitAnimation(() => {
            resetForm();
            onClose();
        });
    };

    const handleSubmit = async () => {
        const newErrors = { current: "", newPassword: "", confirm: "" };
        let hasError = false;

        if (!currentPassword) {
            newErrors.current = "Current password is required.";
            hasError = true;
        }

        const reqs = checkPasswordRequirements(newPassword);
        if (!newPassword) {
            newErrors.newPassword = "New password is required.";
            hasError = true;
        } else if (!isPasswordValid(reqs)) {
            newErrors.newPassword = "New password does not meet requirements.";
            hasError = true;
        }

        if (!confirmPassword) {
            newErrors.confirm = "Confirm password is required.";
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirm = "Passwords do not match.";
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            triggerHaptic("error");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(currentPassword, newPassword);
            triggerHaptic("success");
            // Animate out THEN show alert so modal is gone before dialog appears
            startExitAnimation(() => {
                resetForm();
                onClose();
                Alert.alert("Success", "Password has been changed successfully.", [
                    { text: "OK" },
                ]);
            });
        } catch (err: any) {
            triggerHaptic("error");
            Alert.alert(
                "Error",
                err.message || "Failed to update password. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Effects ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (visible) startEntryAnimation();
    }, [visible]);

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const show = Keyboard.addListener(showEvent, () =>
            setKeyboardVisible(true)
        );
        const hide = Keyboard.addListener(hideEvent, () =>
            setKeyboardVisible(false)
        );

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    // ── Derived values ────────────────────────────────────────────────────

    const reqs = checkPasswordRequirements(newPassword);
    const submitDisabled = !isPasswordValid(reqs) || newPassword !== confirmPassword;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.kavWrapper}
            >
                {/* Animated backdrop */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.backdrop,
                        { opacity: backdropOpacity },
                    ]}
                />

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        keyboardVisible && styles.scrollContentKeyboard,
                    ]}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Animated card */}
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                opacity: cardOpacity,
                                transform: [
                                    { translateY: cardTranslateY },
                                    { scale: cardScale },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.cardTitle}>Reset Password</Text>

                        <CustomInput
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            editable={!loading}
                            error={errors.current}
                        />

                        <CustomInput
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            editable={!loading}
                            error={errors.newPassword}
                        />

                        {/* Password strength checklist */}
                        <View style={styles.reqsContainer}>
                            <RequirementRow
                                label="At least 8 characters"
                                met={reqs.hasMinLength}
                            />
                            <RequirementRow
                                label="At least one uppercase letter (A-Z)"
                                met={reqs.hasUppercase}
                            />
                            <RequirementRow
                                label="At least one lowercase letter (a-z)"
                                met={reqs.hasLowercase}
                            />
                            <RequirementRow
                                label="At least one number (0-9)"
                                met={reqs.hasNumber}
                            />
                            <RequirementRow
                                label="At least one special character (!@#...)"
                                met={reqs.hasSpecialChar}
                            />
                        </View>

                        <CustomInput
                            label="Repeat Password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!loading}
                            error={errors.confirm}
                        />

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.submitBtn,
                                    submitDisabled && styles.submitBtnDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={COLORS.white}
                                    />
                                ) : (
                                    <Text style={styles.submitText}>
                                        Change Password
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    kavWrapper: {
        flex: 1,
    },
    backdrop: {
        backgroundColor: "rgba(15, 23, 42, 0.4)",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    scrollContentKeyboard: {
        justifyContent: "flex-start",
        paddingTop: 10,
        paddingBottom: 40,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.slate800,
        marginBottom: 20,
        textAlign: "center",
    },
    reqsContainer: {
        marginBottom: 16,
        backgroundColor: COLORS.slate50,
        padding: 12,
        borderRadius: 12,
        gap: 6,
    },
    reqRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    reqText: {
        fontSize: 12,
        color: COLORS.slate500,
        fontWeight: "500",
    },
    reqTextMet: {
        color: COLORS.success,
        fontWeight: "600",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.slate600,
    },
    submitBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.white,
    },
});
