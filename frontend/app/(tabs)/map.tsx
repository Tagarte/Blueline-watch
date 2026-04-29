import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import { database } from '../config/firebase';

interface Sensor {
    id: string;
    name: string;
    status: 'NORMAL' | 'ATTENTION' | 'DANGER' | 'INCONNU';
    waterLevel: number;
    lat: number;
    lng: number;
    humidity?: number;
    temperature?: number;
    timestamp?: number;
}

export default function MapScreen() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSensors, setActiveSensors] = useState(0);

    useEffect(() => {
        // Écouter toutes les lectures dans /readings
        const readingsRef = ref(database, 'readings');

        const unsubscribe = onValue(readingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const sensorsList: Sensor[] = [];

                // Parcourir tous les capteurs dans Firebase
                for (const [id, value] of Object.entries(data)) {
                    const reading = value as any;

                    // Générer un nom à partir de l'ID (sans l'écrire manuellement)
                    const sensorName = generateSensorName(id, reading);

                    // Générer des coordonnées cohérentes basées sur l'ID (hash)
                    const { lat, lng } = generateCoordinatesFromId(id);

                    sensorsList.push({
                        id: id,
                        name: sensorName,
                        status: getStatusFromLevel(reading.waterLevel || 0),
                        waterLevel: reading.waterLevel || 0,
                        lat: lat,
                        lng: lng,
                        humidity: reading.humidity,
                        temperature: reading.temperature,
                        timestamp: reading.timestamp,
                    });
                }

                // Trier par niveau d'eau (plus dangereux en premier)
                sensorsList.sort((a, b) => b.waterLevel - a.waterLevel);

                setSensors(sensorsList);
                setActiveSensors(sensorsList.length);
                setLoading(false);
            } else {
                setSensors([]);
                setActiveSensors(0);
                setLoading(false);
            }
        }, (error) => {
            console.error('Erreur:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Générer un nom lisible à partir de l'ID
    const generateSensorName = (id: string, reading: any): string => {
        // Si l'ID contient des indices, essayer de deviner le nom
        const idLower = id.toLowerCase();

        if (idLower.includes('ouss') || idLower.includes('souss')) return 'Oued Souss';
        if (idLower.includes('hassan')) return 'Avenue Hassan II';
        if (idLower.includes('indust')) return 'Zone Industrielle';
        if (idLower.includes('anza')) return 'Anza';
        if (idLower.includes('talborjt')) return 'Talborjt';
        if (idLower.includes('dcheira')) return 'Dcheira';

        // Sinon, générer un nom basé sur le niveau d'eau
        const waterLevel = reading.waterLevel || 0;
        if (waterLevel > 55) return `Capteur ⚠️ ${id.substring(0, 6)}`;
        if (waterLevel > 20) return `Capteur 📍 ${id.substring(0, 6)}`;
        return `Capteur ${id.substring(0, 8)}`;
    };

    // Générer des coordonnées cohérentes basées sur l'ID (hash)
    // Cela garantit que le même ID donne toujours les mêmes coordonnées
    const generateCoordinatesFromId = (id: string): { lat: number; lng: number } => {
        // Zone de base: Agadir
        const BASE_LAT = 30.4278;
        const BASE_LNG = -9.5981;

        // Créer un hash simple à partir de l'ID
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash = hash & hash;
        }

        // Générer des variations dans un rayon de ~5km autour d'Agadir
        const latVariation = (Math.abs(hash % 200) - 100) / 10000; // ±0.01 degré (~1km)
        const lngVariation = (Math.abs((hash >> 8) % 200) - 100) / 10000;

        return {
            lat: BASE_LAT + latVariation,
            lng: BASE_LNG + lngVariation,
        };
    };

    // Déterminer le statut à partir du niveau d'eau
    const getStatusFromLevel = (waterLevel: number): 'NORMAL' | 'ATTENTION' | 'DANGER' => {
        if (waterLevel >= 55) return 'DANGER';
        if (waterLevel >= 20) return 'ATTENTION';
        return 'NORMAL';
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'NORMAL': return '#22c55e';
            case 'ATTENTION': return '#f59e0b';
            case 'DANGER': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'NORMAL': return 'Normal';
            case 'ATTENTION': return 'Attention';
            case 'DANGER': return 'Danger';
            default: return 'Inconnu';
        }
    };

    const getRiskRadius = (status: string): number => {
        switch (status) {
            case 'DANGER': return 300;
            case 'ATTENTION': return 200;
            default: return 150;
        }
    };

    // Centrer la carte sur Agadir
    const initialRegion = {
        latitude: 30.4278,
        longitude: -9.5981,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Chargement des capteurs...</Text>
            </View>
        );
    }

    if (sensors.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cloud-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Aucun capteur</Text>
                <Text style={styles.emptyText}>
                    En attente des premières données des capteurs
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {sensors.map((sensor) => (
                    <Marker
                        key={sensor.id}
                        coordinate={{ latitude: sensor.lat, longitude: sensor.lng }}
                        onPress={() => setSelectedSensor(sensor)}
                    >
                        <Circle
                            center={{ latitude: sensor.lat, longitude: sensor.lng }}
                            radius={getRiskRadius(sensor.status)}
                            fillColor={`${getStatusColor(sensor.status)}20`}
                            strokeColor={getStatusColor(sensor.status)}
                            strokeWidth={2}
                        />

                        <View style={[styles.marker, { backgroundColor: getStatusColor(sensor.status) }]}>
                            <Text style={styles.markerText}>
                                {sensor.waterLevel > 0 ? sensor.waterLevel : '?'}
                            </Text>
                        </View>

                        <Callout tooltip>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{sensor.name}</Text>
                                <Text style={[styles.calloutStatus, { color: getStatusColor(sensor.status) }]}>
                                    {getStatusText(sensor.status)}
                                </Text>
                                <Text style={styles.calloutLevel}>
                                    💧 Niveau: {sensor.waterLevel} cm
                                </Text>
                                {sensor.temperature !== undefined && (
                                    <Text style={styles.calloutDetail}>
                                        🌡️ Temp: {sensor.temperature}°C
                                    </Text>
                                )}
                                {sensor.humidity !== undefined && (
                                    <Text style={styles.calloutDetail}>
                                        💨 Humidité: {sensor.humidity}%
                                    </Text>
                                )}
                                <Text style={styles.calloutId}>
                                    ID: {sensor.id.substring(0, 12)}...
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Légende */}
            <View style={styles.legend}>
                <View style={styles.legendHeader}>
                    <Text style={styles.legendTitle}>📍 Capteurs</Text>
                    <Text style={styles.legendCount}>{activeSensors} actifs</Text>
                </View>
                <View style={styles.legendItems}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                        <Text style={styles.legendText}>Normal (&lt;20 cm)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                        <Text style={styles.legendText}>Attention (20-55 cm)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.legendText}>Danger (&gt;55 cm)</Text>
                    </View>
                </View>
            </View>

            {/* Panneau d'information */}
            {selectedSensor && (
                <TouchableOpacity
                    style={styles.sensorInfo}
                    onPress={() => setSelectedSensor(null)}
                    activeOpacity={0.9}
                >
                    <View style={styles.sensorInfoHeader}>
                        <Text style={styles.sensorInfoTitle}>{selectedSensor.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedSensor(null)}>
                            <Ionicons name="close" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.sensorInfoBody}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedSensor.status) }]}>
                            <Text style={styles.statusBadgeText}>
                                {getStatusText(selectedSensor.status)}
                            </Text>
                        </View>
                        <Text style={styles.sensorInfoDetail}>
                            💧 Niveau d'eau: {selectedSensor.waterLevel} cm
                        </Text>
                        {selectedSensor.temperature !== undefined && (
                            <Text style={styles.sensorInfoDetail}>
                                🌡️ Température: {selectedSensor.temperature}°C
                            </Text>
                        )}
                        {selectedSensor.humidity !== undefined && (
                            <Text style={styles.sensorInfoDetail}>
                                💨 Humidité: {selectedSensor.humidity}%
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 10, color: '#666' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f5f5f5' },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
    emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
    map: { flex: 1 },
    marker: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    markerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    callout: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        minWidth: 170,
        elevation: 3,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    calloutStatus: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
    },
    calloutLevel: {
        fontSize: 12,
        color: '#333',
    },
    calloutDetail: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    calloutId: {
        fontSize: 9,
        color: '#999',
        marginTop: 6,
    },
    legend: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 12,
        elevation: 5,
    },
    legendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    legendTitle: { fontSize: 13, fontWeight: 'bold', color: '#333' },
    legendCount: { fontSize: 12, color: '#007BFF', fontWeight: '500' },
    legendItems: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 11, color: '#333' },
    sensorInfo: {
        position: 'absolute',
        bottom: 140,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        elevation: 6,
        overflow: 'hidden',
    },
    sensorInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#007BFF',
    },
    sensorInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    sensorInfoBody: { padding: 15 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
    statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    sensorInfoDetail: { fontSize: 14, color: '#555', marginTop: 6 },
    sensorInfoId: { fontSize: 10, color: '#999', marginTop: 10, fontFamily: 'monospace' },
});