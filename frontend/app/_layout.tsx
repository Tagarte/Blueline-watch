import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { auth, onAuthStateChange } from "./config/firebase";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            setUser(user);
            if (initializing) setInitializing(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!initializing) {
            if (!user) {
                router.replace('/(auth)/login');
            }
        }
    }, [initializing, user]);

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaProvider>
    );
}