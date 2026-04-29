# 🌊 Blueline Watch - Surveillance intelligente des inondations

[![React Native](https://img.shields.io/badge/React_Native-0.72-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0-blue)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.5-orange)](https://firebase.google.com/)
[![Python](https://img.shields.io/badge/Python-3.9-green)](https://python.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-red)](https://www.arduino.cc/)

## 📋 Description

**Blueline Watch** est une solution complète de surveillance intelligente des risques d'inondation dans les zones urbaines sensibles de la région **Agadir, Inezgane et Aït Melloul**.

Le projet a été développé en réponse aux inondations récurrentes observées dans la région, notamment en mars 2025 et décembre 2017, où des routes inondées et des canalisations bouchées ont causé d'importants dégâts.

### Objectifs principaux

- 🚨 **Détecter** rapidement la montée du niveau d'eau
- 📊 **Surveiller** en temps réel les zones sensibles
- 🔔 **Alerter** les citoyens et les autorités avant que la situation ne devienne critique
- 📈 **Prédire** les risques futurs grâce à l'analyse des tendances
- 🗺️ **Visualiser** tous les capteurs sur une carte interactive

## ✨ Fonctionnalités

### 📱 Application Mobile (React Native / Expo)

| Écran | Fonctionnalités |
|-------|-----------------|
| **Accueil** | 📊 Niveau d'eau en temps réel, tendance, graphique d'évolution, compteur de capteurs actifs |
| **Carte** | 🗺️ Visualisation de tous les capteurs sur la carte d'Agadir, cercles de risque colorés |
| **Alertes** | 🔔 Liste des alertes avec détails (température, humidité, mouvement) |
| **IA** | 🤖 Prédictions du niveau d'eau (1h, 6h, 24h) basées sur la tendance |
| **Historique** | 📜 Données passées avec filtres par statut (NORMAL/ATTENTION/DANGER) |
| **Profil** | 👤 Gestion du compte utilisateur, modification du nom, déconnexion |

### 🖥️ Backend Python (ADIA - Analyse de Données et IA)

- 🔄 Écoute en temps réel des nouvelles données dans Firebase
- 📈 Calcul de la tendance (vitesse de montée/descente de l'eau)
- ⚠️ Détection des seuils critiques (NORMAL: <20cm, ATTENTION: 20-55cm, DANGER: >55cm)
- 🔮 Génération d'alertes prédictives (quand la tendance dépasse +5cm/lecture)
- 💾 Sauvegarde de l'historique complet dans Firebase

### 📡 IoT (ESP32)

| Capteur | Fonction | Broche |
|---------|----------|--------|
| 💧 Niveau d'eau | Mesure analogique de la hauteur d'eau | GPIO 34 |
| 🌡️ DHT22 | Température et humidité ambiante | GPIO 4 |
| 🚶 PIR | Détection de mouvement / obstruction | GPIO 5 |

## 🔧 Installation

### Prérequis

| Logiciel | Version | Lien |
|----------|---------|------|
| Node.js | 18.x ou 20.x | [nodejs.org](https://nodejs.org/) |
| npm | 9.x+ | Inclus avec Node.js |
| Python | 3.9+ | [python.org](https://python.org/) |
| Expo CLI | Dernière version | `npm install -g expo-cli` |
| Android Studio | Dernière version | [developer.android.com](https://developer.android.com/studio) |

### 1️⃣ Frontend (React Native / Expo)

```bash
# Entrer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Modifier .env avec vos clés Firebase
nano .env

# Démarrer l'application
npx expo start

# Pour Android (avec Expo Go)
# Scanner le QR code avec l'application Expo Go

# Pour émulateur Android
npx expo start

