import { Image, Text, View } from "react-native";

type LogoHeaderProps = {
    title?: string;
};

export default function LogoHeader({
    title = "Revopz",
}: LogoHeaderProps) {
    return (
        <View style={{ alignItems: 'center', margin: 60, marginBottom: 48, }}>
            <Image source={require("../../assets/images/revopz-logo.png")}
                resizeMode="contain"
                style={{ width: 110, height: 110, }}
            />

            <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#111827',
                marginTop: 12,
            }}>
                {title}
            </Text>
        </View>
    );
}