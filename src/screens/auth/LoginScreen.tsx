import CustomInput from "@/components/ui/CustomInput";
import LogoHeader from "@/components/ui/LogoHeader";
import PrimaryButton from "@/components/ui/PrimaryInput";
import ScreenContainer from "@/components/ui/ScreenContainer";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { loginUser } from '@/services/authService';

import { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('');
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const validateForm = () => {
        let valid = true;

        const newErrors = {
            email: "",
            password: "",
        };

        if (!email.trim()) {
            newErrors.email = "Email is required";
            valid = false;
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            newErrors.email = "Email is required";
            valid = false;
        }

        if (!password.trim()) {
            newErrors.password = "Password is required";
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
            valid = false
        }

        setErrors(newErrors);

        return valid;
    };


    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            const user = await loginUser(email, password);

            console.log('Logged in user:', user);

            Alert.alert("Login Successful", "Welcome to REVOPZ");
        } catch (error: any) {
            Alert.alert(
                "Login Failed",
                error.message
            );
        }
    };



    return (
        <ScreenContainer>
            <LogoHeader />

            <CustomInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
            />

            <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
            />

            <TouchableOpacity
                style={{
                    alignSelf: "flex-end",
                    marginTop: -6,
                    marginBottom: 12,
                }}
            >
                <Text
                    style={{
                        color: '#0f52cc',
                        fontSize: 14,
                        fontWeight: '500',
                    }}
                >
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <PrimaryButton title="Login" onPress={handleLogin} />

            <ToggleSwitch
                label="Biometric Access"
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
            />
        </ScreenContainer>
    );
}