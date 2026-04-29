import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from '../../components/LineChart';
import {
    listenToAnalysis,
    AnalysisData,
    formatTimestamp,
    auth,
    getUserData,
    UserData,
    getAllReadings,
} from '../config/firebase';

export default function HomeScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [activeSensorsCount, setActiveSensorsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Récupérer les informations utilisateur
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userData = await getUserData(currentUser.uid);
                setUser(userData);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // Écouter les données en temps réel depuis /analysis
    useEffect(() => {
        const unsubscribe = listenToAnalysis((data) => {
            if (data) {
                console.log('📊 Données reçues:', data);
                setAnalysis(data);
            }
        });

        return () => unsubscribe();
    }, []);

    // Charger le nombre de capteurs actifs
    useEffect(() => {
        const loadActiveSensors = async () => {
            try {
                const readings = await getAllReadings();
                // Compter les capteurs qui ont des données récentes (moins de 1 heure)
                const oneHourAgo = Date.now() - 3600000;
                const activeSensors = readings.filter((reading: any) => {
                    // Si le capteur a un timestamp et qu'il est récent
                    return reading.timestamp && reading.timestamp > oneHourAgo;
                });
                setActiveSensorsCount(activeSensors.length || readings.length);
            } catch (error) {
                console.error('Erreur chargement capteurs:', error);
                setActiveSensorsCount(6); // Valeur par défaut
            }
        };

        loadActiveSensors();

        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(loadActiveSensors, 30000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        // Recharger les capteurs
        const readings = await getAllReadings();
        setActiveSensorsCount(readings.length);
        setRefreshing(false);
    };

    // Valeurs extraites de l'analyse
    const waterLevel = analysis?.waterLevel ?? 0;
    const status = analysis?.status ?? 'INCONNU';
    const trend = analysis?.trend ?? 0;
    const predictiveAlert = analysis?.predictiveAlert ?? false;
    const lastUpdate = analysis?.timestamp ?? Date.now();

    // Obtenir le nom d'utilisateur
    const displayName = user?.displayName || 'Utilisateur';
    const userInitial = displayName.charAt(0).toUpperCase();

    // Déterminer l'affichage du risque
    const getRiskText = (status: string): string => {
        switch (status) {
            case 'NORMAL': return 'Faible';
            case 'ATTENTION': return 'Moyen';
            case 'DANGER': return 'Élevé';
            default: return 'Inconnu';
        }
    };

    const getRiskColor = (status: string): string => {
        switch (status) {
            case 'NORMAL': return '#22c55e';
            case 'ATTENTION': return '#f59e0b';
            case 'DANGER': return '#ef4444';
            default: return '#6b7280';
        }
    };

    // Données pour le graphique
    const chartData = [35, 42, 38, 45, 52, 48, 55, 62, 58, waterLevel];
    const chartLabels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', 'Maintenant'];

    // Calculer le nombre de zones critiques
    const criticalZones = status === 'DANGER' ? 1 : status === 'ATTENTION' ? 1 : 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Header avec utilisateur */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Bonjour,</Text>
                        <Text style={styles.userName}>{displayName} 🐟</Text>
                    </View>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{userInitial}</Text>
                    </View>
                </View>
            </View>

            {/* Carte de risque principale */}
            <View style={styles.riskCard}>
                <Text style={styles.riskLabel}>Niveau de risque actuel</Text>
                <Text style={[styles.riskValue, { color: getRiskColor(status) }]}>
                    {getRiskText(status)}
                </Text>

                {/* Affichage de la tendance */}
                {Math.abs(trend) > 0.01 && (
                    <View style={styles.trendContainer}>
                        <Ionicons
                            name={trend > 0 ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={trend > 0 ? '#ef4444' : '#22c55e'}
                        />
                        <Text style={[styles.trendText, { color: trend > 0 ? '#ef4444' : '#22c55e' }]}>
                            {trend > 0 ? '+' : ''}{trend.toFixed(1)} cm/lecture
                        </Text>
                    </View>
                )}

                <View style={styles.riskStats}>
                    <Text style={styles.riskStatsText}>
                        Niveau d'eau : {waterLevel} cm • {activeSensorsCount} capteurs actifs
                    </Text>
                </View>
            </View>

            {/* Statistiques : Niveau moyen + Alertes */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statBoxTitle}>Niveau moyen</Text>
                    <Text style={styles.statBoxValue}>{waterLevel} cm</Text>
                    <Text style={styles.statBoxSub}>Sur {activeSensorsCount} capteurs</Text>
                </View>

                <View style={styles.statBox}>
                    <Text style={styles.statBoxTitle}>Alertes</Text>
                    <Text style={[styles.statBoxValue, { color: criticalZones > 0 ? '#ef4444' : '#22c55e' }]}>
                        {criticalZones}
                    </Text>
                    <Text style={styles.statBoxSub}>Zones critiques</Text>
                </View>
            </View>

            {/* Alerte prédictive */}
            {predictiveAlert && (
                <View style={styles.predictiveCard}>
                    <Ionicons name="warning" size={20} color="#f59e0b" />
                    <Text style={styles.predictiveText}>
                        ⚠️ PRÉDICTION : L'eau monte rapidement ! Risque imminent.
                    </Text>
                </View>
            )}

            {/* Graphique d'évolution */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Évolution du niveau d'eau</Text>
                <Text style={styles.chartSubtitle}>Dernières 24h</Text>
                <LineChart
                    data={chartData}
                    labels={chartLabels}
                    height={220}
                    color="#007BFF"
                />
            </View>

            {/* Dernière mise à jour */}
            <View style={styles.updateFooter}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.updateText}>
                    Dernière mise à jour: {formatTimestamp(lastUpdate)}
                </Text>
            </View>
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
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 2,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    riskCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    riskLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    riskValue: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    riskStats: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        width: '100%',
        alignItems: 'center',
    },
    riskStatsText: {
        fontSize: 12,
        color: '#888',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        gap: 15,
        marginBottom: 15,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statBoxTitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    statBoxValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statBoxSub: {
        fontSize: 11,
        color: '#888',
        marginTop: 6,
    },
    predictiveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fde047',
        gap: 8,
    },
    predictiveText: {
        flex: 1,
        fontSize: 12,
        color: '#854d0e',
    },
    chartCard: {
        backgroundColor: '#fff',
        margin: 15,
        marginTop: 0,
        padding: 15,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 15,
    },
    updateFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        marginBottom: 10,
        gap: 6,
    },
    updateText: {
        fontSize: 11,
        color: '#999',
    },
});