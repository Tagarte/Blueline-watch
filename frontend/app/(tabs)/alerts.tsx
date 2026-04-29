import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    listenToAnalysis,
    listenToLatestData,
    AnalysisData,
    getStatusColor,
    formatDate
} from '../config/firebase';

interface LocalAlert {
    id: string;
    type: 'warning' | 'danger' | 'info';
    message: string;
    timestamp: number;
    waterLevel: number;
}

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState<LocalAlert[]>([]);
    const [lastStatus, setLastStatus] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Écouter les analyses pour générer des alertes
        const unsubscribeAnalysis = listenToAnalysis((data) => {
            if (data) {
                checkAndGenerateAlert(data);
            }
            setLoading(false);
        });

        return () => unsubscribeAnalysis();
    }, []);

    const checkAndGenerateAlert = (data: AnalysisData) => {
        const now = Date.now();
        const newAlerts: LocalAlert[] = [];

        // Alerte de danger
        if (data.status === 'DANGER') {
            const existingDanger = alerts.find(a => a.type === 'danger' && (now - a.timestamp) < 3600000);
            if (!existingDanger) {
                newAlerts.push({
                    id: `danger-${now}`,
                    type: 'danger',
                    message: `Niveau d'eau critique ! ${data.waterLevel} cm - Risque d'inondation imminent.`,
                    timestamp: now,
                    waterLevel: data.waterLevel
                });
            }
        }

        // Alerte prédictive
        if (data.predictiveAlert && data.status !== 'DANGER') {
            const existingPredictive = alerts.find(a => a.type === 'warning' && (now - a.timestamp) < 1800000);
            if (!existingPredictive) {
                newAlerts.push({
                    id: `predictive-${now}`,
                    type: 'warning',
                    message: `⚠️ Tendance haussière détectée ! L'eau monte rapidement (${data.trend > 0 ? '+' : ''}${data.trend.toFixed(1)} cm/lecture).`,
                    timestamp: now,
                    waterLevel: data.waterLevel
                });
            }
        }

        // Alerte d'attention
        if (data.status === 'ATTENTION' && lastStatus !== 'ATTENTION') {
            newAlerts.push({
                id: `attention-${now}`,
                type: 'info',
                message: `Seuil d'attention dépassé. Niveau d'eau: ${data.waterLevel} cm. Restez vigilant.`,
                timestamp: now,
                waterLevel: data.waterLevel
            });
        }

        // Alerte retour à la normale
        if (data.status === 'NORMAL' && (lastStatus === 'DANGER' || lastStatus === 'ATTENTION')) {
            newAlerts.push({
                id: `normal-${now}`,
                type: 'info',
                message: `Niveau d'eau revenu à la normale (${data.waterLevel} cm). Fin de l'alerte.`,
                timestamp: now,
                waterLevel: data.waterLevel
            });
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev]);
        }
        setLastStatus(data.status);
    };

    const getAlertIcon = (type: string): string => {
        switch (type) {
            case 'danger': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getAlertColor = (type: string): string => {
        switch (type) {
            case 'danger': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#007BFF';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text>Chargement des alertes...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Alertes</Text>
                <Text style={styles.alertCount}>{alerts.length} alerte(s)</Text>
            </View>

            <ScrollView style={styles.alertsList}>
                {alerts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                        <Text style={styles.emptyText}>Aucune alerte</Text>
                        <Text style={styles.emptySubtext}>Tout est sous contrôle</Text>
                    </View>
                ) : (
                    alerts.map((alert) => (
                        <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type), borderLeftWidth: 4 }]}>
                            <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                                <Ionicons name={getAlertIcon(alert.type)} size={24} color={getAlertColor(alert.type)} />
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={styles.alertMessage}>{alert.message}</Text>
                                <Text style={styles.alertTime}>{formatDate(alert.timestamp)}</Text>
                                <Text style={styles.alertLevel}>Niveau: {alert.waterLevel} cm</Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    alertCount: { fontSize: 14, color: '#dc3545', fontWeight: '500' },
    alertsList: { flex: 1, padding: 15 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20 },
    emptySubtext: { fontSize: 14, color: '#666', marginTop: 10 },
    alertCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
    alertIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    alertContent: { flex: 1 },
    alertMessage: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 },
    alertTime: { fontSize: 11, color: '#999', marginBottom: 4 },
    alertLevel: { fontSize: 11, color: '#dc3545', fontWeight: '500' },
});