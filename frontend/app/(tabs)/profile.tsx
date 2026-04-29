import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, getUserData, updateUserProfile, logoutUser, UserData } from '../config/firebase';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const userData = await getUserData(currentUser.uid);
            setUser(userData);
            setDisplayName(userData?.displayName || '');
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateUserProfile(user.uid, { displayName });
            setUser({ ...user, displayName });
            setEditing(false);
            Alert.alert('Succès', 'Profil mis à jour');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logoutUser();
                            router.replace('/(auth)/login');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de se déconnecter');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* En-tête */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.displayName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    {!editing && (
                        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                            <Ionicons name="pencil" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                {editing ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.editInput}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Votre nom"
                            placeholderTextColor="#999"
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.userName}>{user?.displayName || 'Utilisateur'}</Text>
                )}
                <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Menu */}
            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Compte</Text>

                <View style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="mail-outline" size={22} color="#007BFF" />
                        <Text style={styles.menuItemText}>Email</Text>
                    </View>
                    <Text style={styles.menuItemValue}>{user?.email}</Text>
                </View>

                <View style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="calendar-outline" size={22} color="#007BFF" />
                        <Text style={styles.menuItemText}>Membre depuis</Text>
                    </View>
                    <Text style={styles.menuItemValue}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Nouveau'}
                    </Text>
                </View>
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Préférences</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="notifications-outline" size={22} color="#007BFF" />
                        <Text style={styles.menuItemText}>Notifications</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="language-outline" size={22} color="#007BFF" />
                        <Text style={styles.menuItemText}>Langue</Text>
                    </View>
                    <Text style={styles.menuItemValue}>Français</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="moon-outline" size={22} color="#007BFF" />
                        <Text style={styles.menuItemText}>Thème sombre</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Déconnexion */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>

            <Text style={styles.version}>FloodWatch v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#007BFF',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#007BFF',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 5,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    editContainer: {
        width: '80%',
        marginTop: 10,
    },
    editInput: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#22c55e',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    menuSection: {
        backgroundColor: '#fff',
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
        marginTop: 5,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
    },
    menuItemValue: {
        fontSize: 14,
        color: '#999',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#fff',
        margin: 15,
        marginTop: 30,
        padding: 16,
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '500',
    },
    version: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginBottom: 30,
        marginTop: 20,
    },
});