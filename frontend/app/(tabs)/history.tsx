import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import { database } from '../config/firebase';

interface HistoryItem {
    id: string;
    date: string;
    predictiveAlert: boolean;
    status: string;
    time: string;
    timestamp: number;
    trend: number;
    waterLevel: number;
}

export default function HistoryScreen() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'DANGER' | 'ATTENTION' | 'NORMAL'>('all');

    // Récupérer l'historique depuis Firebase
    useEffect(() => {
        loadHistory();

        // Écouter les changements en temps réel
        const historyRef = ref(database, 'analysis/history');
        const unsubscribe = onValue(historyRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const historyList: HistoryItem[] = [];

                for (const [id, value] of Object.entries(data)) {
                    const item = value as any;
                    historyList.push({
                        id: id,
                        date: item.date || '',
                        predictiveAlert: item.predictiveAlert || false,
                        status: item.status || 'INCONNU',
                        time: item.time || '',
                        timestamp: item.timestamp || 0,
                        trend: item.trend || 0,
                        waterLevel: item.waterLevel || 0,
                    });
                }

                // Trier par date (plus récent en premier)
                historyList.sort((a, b) => b.timestamp - a.timestamp);
                setHistory(historyList);
                setLoading(false);
            } else {
                setHistory([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const loadHistory = async () => {
        try {
            const historyRef = ref(database, 'analysis/history');
            const snapshot = await get(historyRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                const historyList: HistoryItem[] = [];

                for (const [id, value] of Object.entries(data)) {
                    const item = value as any;
                    historyList.push({
                        id: id,
                        date: item.date || '',
                        predictiveAlert: item.predictiveAlert || false,
                        status: item.status || 'INCONNU',
                        time: item.time || '',
                        timestamp: item.timestamp || 0,
                        trend: item.trend || 0,
                        waterLevel: item.waterLevel || 0,
                    });
                }

                historyList.sort((a, b) => b.timestamp - a.timestamp);
                setHistory(historyList);
            }
        } catch (error) {
            console.error('Erreur chargement historique:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'DANGER': return '#ef4444';
            case 'ATTENTION': return '#f59e0b';
            case 'NORMAL': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'DANGER': return 'Élevé';
            case 'ATTENTION': return 'Moyen';
            case 'NORMAL': return 'Faible';
            default: return 'Inconnu';
        }
    };

    const getStatusIcon = (status: string): string => {
        switch (status) {
            case 'DANGER': return 'alert-circle';
            case 'ATTENTION': return 'warning';
            case 'NORMAL': return 'checkmark-circle';
            default: return 'help-circle';
        }
    };

    // Filtrer les données
    const filteredHistory = filter === 'all'
        ? history
        : history.filter(item => item.status === filter);

    // Calculer les statistiques
    const totalReadings = history.length;
    const dangerCount = history.filter(item => item.status === 'DANGER').length;
    const avgWaterLevel = history.length > 0
        ? Math.round(history.reduce((sum, item) => sum + item.waterLevel, 0) / history.length)
        : 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Chargement de l'historique...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* En-tête avec statistiques */}
            <View style={styles.header}>
                <Text style={styles.title}>📜 Historique</Text>
                <Text style={styles.subtitle}>Suivi des niveaux d'eau</Text>
            </View>

            {/* Cartes statistiques */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalReadings}</Text>
                    <Text style={styles.statLabel}>Total mesures</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{dangerCount}</Text>
                    <Text style={styles.statLabel}>Alertes danger</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{avgWaterLevel} cm</Text>
                    <Text style={styles.statLabel}>Moyenne</Text>
                </View>
            </View>

            {/* Filtres */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'DANGER' && styles.filterActiveDanger]}
                    onPress={() => setFilter('DANGER')}
                >
                    <Text style={[styles.filterText, filter === 'DANGER' && styles.filterTextActive]}>Danger</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'ATTENTION' && styles.filterActiveWarning]}
                    onPress={() => setFilter('ATTENTION')}
                >
                    <Text style={[styles.filterText, filter === 'ATTENTION' && styles.filterTextActive]}>Attention</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'NORMAL' && styles.filterActiveNormal]}
                    onPress={() => setFilter('NORMAL')}
                >
                    <Text style={[styles.filterText, filter === 'NORMAL' && styles.filterTextActive]}>Normal</Text>
                </TouchableOpacity>
            </View>

            {/* Liste de l'historique */}
            {filteredHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Aucune donnée historique</Text>
                    <Text style={styles.emptySubtext}>
                        Les mesures apparaîtront ici automatiquement
                    </Text>
                </View>
            ) : (
                filteredHistory.map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                <Ionicons name={getStatusIcon(item.status)} size={14} color="#fff" />
                                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                            </View>
                            <Text style={styles.cardDate}>
                                {item.date} • {item.time}
                            </Text>
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.dataRow}>
                                <View style={styles.dataCol}>
                                    <Ionicons name="water" size={20} color="#007BFF" />
                                    <Text style={styles.dataLabel}>Niveau d'eau</Text>
                                    <Text style={styles.dataValue}>{item.waterLevel} cm</Text>
                                </View>
                                <View style={styles.dataCol}>
                                    <Ionicons name="trending-up" size={20} color="#8b5cf6" />
                                    <Text style={styles.dataLabel}>Tendance</Text>
                                    <Text style={styles.dataValue}>
                                        {item.trend > 0 ? '+' : ''}{item.trend} cm
                                    </Text>
                                </View>
                                <View style={styles.dataCol}>
                                    <Ionicons
                                        name={item.predictiveAlert ? 'warning' : 'checkmark-circle'}
                                        size={20}
                                        color={item.predictiveAlert ? '#f59e0b' : '#22c55e'}
                                    />
                                    <Text style={styles.dataLabel}>Prédiction</Text>
                                    <Text style={[styles.dataValue, { color: item.predictiveAlert ? '#f59e0b' : '#22c55e' }]}>
                                        {item.predictiveAlert ? 'Active' : 'Normale'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))
            )}
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
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingBottom: 10,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterActive: {
        backgroundColor: '#007BFF',
        borderColor: '#007BFF',
    },
    filterActiveDanger: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    filterActiveWarning: {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
    filterActiveNormal: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    filterText: {
        fontSize: 13,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    historyCard: {
        backgroundColor: '#fff',
        margin: 15,
        marginTop: 5,
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardDate: {
        fontSize: 11,
        color: '#999',
    },
    cardContent: {
        padding: 15,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dataCol: {
        alignItems: 'center',
        flex: 1,
    },
    dataLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 6,
    },
    dataValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
});