import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#007BFF',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                headerStyle: {
                    backgroundColor: '#007BFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Carte',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: 'Alertes',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ia"
                options={{
                    title: 'IA',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'rocket' : 'rocket-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Historique',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}