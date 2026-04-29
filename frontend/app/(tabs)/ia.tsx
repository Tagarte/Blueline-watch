import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from '../../components/LineChart';
import {
    listenToAnalysis,
    getHistoricalData,
    AnalysisData,
    HistoricalData,
    formatTimestamp,
} from '../config/firebase';

export default function IAScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [predictions, setPredictions] = useState<{ hours: number; level: number; confidence: number; risk: string }[]>([]);

    useEffect(() => {
        // Écouter les données en temps réel
        const unsubscribeAnalysis = listenToAnalysis((data) => {
            if (data) {
                setAnalysis(data);
                generatePredictions(data);
            }
            setLoading(false);
        });

        loadHistoricalData();

        return () => unsubscribeAnalysis();
    }, []);

    const loadHistoricalData = async () => {
        try {
            const history = await getHistoricalData(20);
            setHistoricalData(history);
        } catch (error) {
            console.error('Erreur historique:', error);
        }
    };

    const generatePredictions = (currentData: AnalysisData) => {
        const trend = currentData.trend;
        const currentLevel = currentData.waterLevel;

        // Générer des prédictions basées sur la tendance réelle
        const predictionsList = [
            {
                hours: 1,
                level: Math.max(0, Math.round(currentLevel + trend * 12)),
                confidence: 92,
                risk: getRiskFromLevel(Math.max(0, Math.round(currentLevel + trend * 12)))
            },
            {
                hours: 6,
                level: Math.max(0, Math.round(currentLevel + trend * 72)),
                confidence: 78,
                risk: getRiskFromLevel(Math.max(0, Math.round(currentLevel + trend * 72)))
            },
            {
                hours: 24,
                level: Math.max(0, Math.round(currentLevel + trend * 288)),
                confidence: 65,
                risk: getRiskFromLevel(Math.max(0, Math.round(currentLevel + trend * 288)))
            },
        ];

        setPredictions(predictionsList);
    };

    const getRiskFromLevel = (level: number): string => {
        if (level >= 55) return 'Élevé';
        if (level >= 20) return 'Moyen';
        return 'Faible';
    };

    const getRiskColor = (risk: string): string => {
        switch (risk) {
            case 'Élevé': return '#ef4444';
            case 'Moyen': return '#f59e0b';
            case 'Faible': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistoricalData();
        setRefreshing(false);
    };

    // Données pour le graphique
    const chartData = [
        analysis?.waterLevel || 0,
        predictions[0]?.level || 0,
        predictions[1]?.level || 0,
        predictions[2]?.level || 0
    ];
    const chartLabels = ['Maintenant', '+1h', '+6h', '+24h'];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Chargement des prédictions...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* En-tête */}
            <View style={styles.header}>
                <Text style={styles.title}>Prédictions IA</Text>
                <Text style={styles.subtitle}>
                    Basées sur l'analyse des tendances
                </Text>
            </View>

            {/* Niveau actuel */}
            <View style={styles.currentCard}>
                <Text style={styles.currentLabel}>Niveau actuel</Text>
                <Text style={styles.currentValue}>{analysis?.waterLevel || 0} cm</Text>
                <View style={styles.trendContainer}>
                    <Ionicons
                        name={(analysis?.trend || 0) > 0 ? 'trending-up' : 'trending-down'}
                        size={16}
                        color={(analysis?.trend || 0) > 0 ? '#ef4444' : '#22c55e'}
                    />
                    <Text style={styles.currentTrend}>
                        Tendance: {(analysis?.trend || 0) > 0 ? '+' : ''}{(analysis?.trend || 0).toFixed(2)} cm/lecture
                    </Text>
                </View>
            </View>

            {/* Cartes de prédiction */}
            <View style={styles.predictionsRow}>
                {predictions.map((pred) => (
                    <View key={pred.hours} style={styles.predictionCard}>
                        <Text style={styles.predictionLabel}>
                            Dans {pred.hours} heure{pred.hours > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.predictionValue}>{pred.level} cm</Text>
                        <Text style={[styles.predictionChange, { color: pred.level > (analysis?.waterLevel || 0) ? '#ef4444' : '#22c55e' }]}>
                            {pred.level > (analysis?.waterLevel || 0) ? '↗' : '↘'} {Math.abs(pred.level - (analysis?.waterLevel || 0))} cm
                        </Text>
                        <Text style={styles.confidence}>Confiance: {pred.confidence}%</Text>
                    </View>
                ))}
            </View>

            {/* Graphique de prédiction */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Courbe de prédiction</Text>
                <LineChart
                    data={chartData}
                    labels={chartLabels}
                    height={250}
                    color="#007BFF"
                />
            </View>

            {/* Évaluation du risque */}
            <View style={styles.riskCard}>
                <Text style={styles.riskTitle}>Évaluation du risque</Text>
                {predictions.map((pred) => (
                    <View key={pred.hours} style={styles.riskItem}>
                        <View>
                            <Text style={styles.riskTime}>Dans {pred.hours} heure{pred.hours > 1 ? 's' : ''}</Text>
                            <Text style={styles.riskLevel}>{pred.level} cm estimé</Text>
                        </View>
                        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(pred.risk) }]}>
                            <Text style={styles.riskBadgeText}>{pred.risk}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Informations */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Comment ça fonctionne ?</Text>
                <Text style={styles.infoText}>
                    L'IA analyse la tendance actuelle (vitesse de montée/descente de l'eau)
                    et extrapole les valeurs futures. Les prédictions sont mises à jour
                    automatiquement à chaque nouvelle mesure.
                </Text>
                <Text style={styles.infoFooter}>
                    Dernière analyse: {analysis?.timestamp ? formatTimestamp(analysis.timestamp) : '--:--:--'}
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
        backgroundColor: '#007BFF',
        padding: 20,
        paddingBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginTop: 5,
    },
    currentCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
    },
    currentLabel: {
        fontSize: 14,
        color: '#666',
    },
    currentValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    currentTrend: {
        fontSize: 14,
        color: '#666',
    },
    predictionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        gap: 12,
        marginBottom: 15,
    },
    predictionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        elevation: 2,
    },
    predictionLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    predictionValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    predictionChange: {
        fontSize: 12,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    confidence: {
        fontSize: 10,
        color: '#999',
    },
    chartCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 16,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    riskCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 16,
        elevation: 2,
    },
    riskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    riskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    riskTime: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    riskLevel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    riskBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    riskBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: '#e8f4ff',
        margin: 15,
        marginBottom: 30,
        padding: 15,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007BFF',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#555',
        lineHeight: 18,
    },
    infoFooter: {
        fontSize: 10,
        color: '#888',
        marginTop: 10,
        textAlign: 'right',
    },
});