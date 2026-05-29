import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    TouchableWithoutFeedback,
    Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";

// Define Button Config matching React Native's AlertButton
export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

// Define Alert Options
export interface AlertOptions {
    cancelable?: boolean;
}

interface AlertState {
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
    options?: AlertOptions;
}

interface AlertContextProps {
    showAlert: (
        title: string,
        message?: string,
        buttons?: AlertButton[],
        options?: AlertOptions
    ) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

// Primary Amber Color Palette
const AMBER_COLORS = {
    primary: "#D97706",    // Dark amber / warning
    lightBg: "#FEF3C7",    // Light amber background
    hover: "#B45309",      // Hover / active amber
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        title: "",
        message: "",
        buttons: [],
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const animateIn = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateOut = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
        });
    };

    const showAlert = useCallback(
        (
            title: string,
            message?: string,
            buttons?: AlertButton[],
            options?: AlertOptions
        ) => {
            setAlert({
                visible: true,
                title,
                message,
                buttons: buttons || [{ text: "OK" }],
                options,
            });
            animateIn();
        },
        []
    );

    const hideAlert = useCallback(() => {
        animateOut(() => {
            setAlert((prev) => ({ ...prev, visible: false }));
        });
    }, []);

    const handleButtonPress = (btn: AlertButton) => {
        hideAlert();
        if (btn.onPress) {
            // Run action after animation starts closing
            setTimeout(() => {
                btn.onPress?.();
            }, 100);
        }
    };

    const handleBackdropPress = () => {
        if (alert.options?.cancelable !== false) {
            hideAlert();
        }
    };

    // Determine icon based on title keywords
    const getAlertIcon = () => {
        const titleLower = alert.title.toLowerCase();
        const msgLower = (alert.message || "").toLowerCase();
        
        if (titleLower.includes("success") || titleLower.includes("registered") || msgLower.includes("successfully")) {
            return "check-circle";
        }
        if (titleLower.includes("error") || titleLower.includes("failed") || titleLower.includes("invalid")) {
            return "alert-circle";
        }
        if (titleLower.includes("warning") || titleLower.includes("delete") || titleLower.includes("remove") || titleLower.includes("logout") || titleLower.includes("log out")) {
            return "alert-triangle";
        }
        return "info";
    };

    const iconName = getAlertIcon();

    // Custom buttons render layout
    const renderButtons = () => {
        const { buttons } = alert;
        if (!buttons || buttons.length === 0) return null;

        // Side-by-side layout for exactly two buttons
        const isSideBySide = buttons.length === 2;

        return (
            <View style={[styles.buttonContainer, isSideBySide ? styles.rowButtons : styles.columnButtons]}>
                {buttons.map((btn, idx) => {
                    const isCancel = btn.style === "cancel";
                    const isDestructive = btn.style === "destructive";
                    
                    let buttonStyle = styles.defaultBtn;
                    let textStyle = styles.defaultBtnText;

                    if (isCancel) {
                        buttonStyle = styles.cancelBtn;
                        textStyle = styles.cancelBtnText;
                    } else if (isDestructive) {
                        buttonStyle = styles.destructiveBtn;
                        textStyle = styles.destructiveBtnText;
                    }

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[buttonStyle, isSideBySide && { flex: 1 }]}
                            onPress={() => handleButtonPress(btn)}
                            activeOpacity={0.8}
                        >
                            <Text style={textStyle}>{btn.text}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <Modal
                transparent
                visible={alert.visible}
                animationType="none"
                onRequestClose={handleBackdropPress}
            >
                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.alertBox,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ scale: scaleAnim }],
                                    },
                                ]}
                            >
                                {/* Amber Icon Ring */}
                                <View style={styles.iconCircle}>
                                    <Feather name={iconName} size={30} color={AMBER_COLORS.primary} />
                                </View>

                                {/* Title & Message */}
                                <Text style={styles.title}>{alert.title}</Text>
                                {alert.message ? (
                                    <Text style={styles.message}>{alert.message}</Text>
                                ) : null}

                                {/* Buttons */}
                                {renderButtons()}
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </Animated.View>
                </TouchableWithoutFeedback>
            </Modal>
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
}

// Global alert reference wrapper so it can be called from outside React components if needed
let globalAlertRef: AlertContextProps | null = null;

export const globalAlert = {
    setRef: (ref: AlertContextProps | null) => {
        globalAlertRef = ref;
    },
    show: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
        if (globalAlertRef) {
            globalAlertRef.showAlert(title, message, buttons, options);
        } else {
            // Fallback to standard Alert if context isn't ready
            const { Alert: RNAlert } = require("react-native");
            RNAlert.alert(title, message, buttons, options);
        }
    },
};

export const Alert = {
    alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
        globalAlert.show(title, message, buttons, options);
    },
};

// Hook provider component to capture the ref globally
export function GlobalAlertSetter() {
    const alertContext = useAlert();
    React.useEffect(() => {
        globalAlert.setRef(alertContext);
        return () => {
            globalAlert.setRef(null);
        };
    }, [alertContext]);
    return null;
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.4)", // Sleek slate-900 overlay
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    alertBox: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 24,
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FEF3C7", // Light amber matching theme
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#191C1E",
        textAlign: "center",
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: "#434655",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonContainer: {
        width: "100%",
        gap: 10,
    },
    rowButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    columnButtons: {
        flexDirection: "column",
    },
    defaultBtn: {
        height: 48,
        backgroundColor: AMBER_COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: AMBER_COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    defaultBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: FONT_WEIGHT.bold as any,
    },
    cancelBtn: {
        height: 48,
        backgroundColor: "transparent",
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    cancelBtnText: {
        color: "#434655",
        fontSize: 15,
        fontWeight: FONT_WEIGHT.semibold as any,
    },
    destructiveBtn: {
        height: 48,
        backgroundColor: "#BA1A1A", // RED/error matching theme
        borderRadius: RADIUS.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    destructiveBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: FONT_WEIGHT.bold as any,
    },
});

