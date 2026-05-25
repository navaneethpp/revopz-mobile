import CustomInput from "@/components/ui/CustomInput";
import LogoHeader from "@/components/ui/LogoHeader";
import PrimaryButton from "@/components/ui/PrimaryInput";
import ScreenContainer from "@/components/ui/ScreenContainer";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useState } from "react";
import { Text, TouchableOpacity } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('');
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const handleLogin = () => {
        console.log('Login Pressed');
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
            />

            <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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