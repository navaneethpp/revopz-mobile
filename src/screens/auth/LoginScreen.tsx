/**
 * src/screens/auth/LoginScreen.tsx
 *
 * Login screen: validates input, calls loginUser(), and handles loading/error
 * states. Navigation to /home is handled inside authService so the screen only
 * needs to manage UI concerns.
 */
import { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Text, TouchableOpacity, View } from "react-native";
import { Alert } from "@/context/AlertContext";

import CustomInput from "@/components/ui/CustomInput";
import LogoHeader from "@/components/ui/LogoHeader";
import PrimaryButton from "@/components/ui/PrimaryInput";
import ScreenContainer from "@/components/ui/ScreenContainer";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { loginUser } from "@/services/authService";

// -----------------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
    email: string;
    password: string;
}

function validate(email: string, password: string): FormErrors {
    const errors: FormErrors = { email: "", password: "" };

    if (!email.trim()) {
        errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.email = "Please enter a valid email address.";
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }

    return errors;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
        ]).then(([hasHardware, isEnrolled]) => {
            setIsBiometricSupported(hasHardware && isEnrolled);
        });

        // Load initial biometric preference
        SecureStore.getItemAsync("biometric_enabled").then((val) => {
            if (val !== null) setBiometricEnabled(val === "true");
        });
    }, []);

    // Clear a specific field error as the user types
    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (errors.email) setErrors((e) => ({ ...e, email: "" }));
    };

    // FV-02: re-validate on blur so the user gets real-time feedback
    // when they leave a field rather than only on submit.
    const handleEmailBlur = () => {
        if (!email.trim()) {
            setErrors((e) => ({ ...e, email: "Email is required." }));
        } else if (!EMAIL_REGEX.test(email.trim())) {
            setErrors((e) => ({ ...e, email: "Please enter a valid email address." }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (errors.password) setErrors((e) => ({ ...e, password: "" }));
    };

    // FV-02: re-validate password on blur
    const handlePasswordBlur = () => {
        if (!password) {
            setErrors((e) => ({ ...e, password: "Password is required." }));
        } else if (password.length < 6) {
            setErrors((e) => ({ ...e, password: "Password must be at least 6 characters." }));
        }
    };

    const handleLogin = async () => {
        // 1. Client-side validation
        const fieldErrors = validate(email, password);
        const hasErrors = Object.values(fieldErrors).some(Boolean);

        if (hasErrors) {
            setErrors(fieldErrors);
            return;
        }

        // 2. Attempt login
        setLoading(true);
        try {
            // loginUser handles navigation internally on success
            await loginUser(email, password);
            // SS-01: write biometric preference ONLY after login succeeds,
            // so a failed login attempt on a shared device doesn't persist
            // the wrong user's biometric preference.
            await SecureStore.setItemAsync("biometric_enabled", biometricEnabled ? "true" : "false");
        } catch (err: any) {
            // Show error as an Alert (keeps the screen clean for retry)
            Alert.alert(
                "Login Failed",
                err?.message ?? "An unexpected error occurred. Please try again.",
                [{ text: "OK" }],
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer>
            <LogoHeader />

            <CustomInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                error={errors.email}
                editable={!loading}
            />

            <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={handlePasswordBlur}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={errors.password}
                editable={!loading}
            />

            <TouchableOpacity
                style={{
                    alignSelf: "flex-end",
                    marginTop: -6,
                    marginBottom: 12,
                }}
                activeOpacity={0.7}
                onPress={() => {
                    Alert.alert(
                        "Reset Password",
                        "Please contact an administrator with the Manage role to reset your password.",
                        [{ text: "OK" }]
                    );
                }}
            >
                <Text
                    style={{
                        color: "#0f52cc",
                        fontSize: 14,
                        fontWeight: "500",
                    }}
                >
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <PrimaryButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
            />

            {isBiometricSupported && (
                <View style={{ marginTop: 8 }}>
                    <ToggleSwitch
                        label="Biometric Access"
                        value={biometricEnabled}
                        onValueChange={setBiometricEnabled}
                    />
                </View>
            )}
        </ScreenContainer>
    );
}