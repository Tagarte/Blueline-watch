import firebase_admin
from firebase_admin import credentials, db
import time
from collections import deque

# --- CONFIGURATION FIREBASE ---
# Remplacez par le chemin vers votre fichier de clé privée Firebase et l'URL de votre DB
SERVICE_ACCOUNT_KEY_PATH = "serviceAccountKey.json"
DATABASE_URL = "https://projetentrep-5c27e-default-rtdb.firebaseio.com/"

# --- CONFIGURATION DES SEUILS ET PREDICTIONS ---
SEUIL_NORMAL = 20
SEUIL_DANGER = 55
HISTORY_SIZE = 5  # Nombre de lectures à conserver pour la prédiction
PREDICTION_THRESHOLD = 5  # Vitesse de montée critique (ex: +5cm en moyenne)

# Historique pour la logique de prédiction
water_level_history = deque(maxlen=HISTORY_SIZE)

def init_firebase():
    """Initialise la connexion à Firebase."""
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred, {
            'databaseURL': DATABASE_URL
        })
        print("[OK] Connexion à Firebase réussie.")
    except Exception as e:
        print(f"[ERREUR] Erreur de connexion à Firebase: {e}")
        print("\n[ATTENTION] Assurez-vous d'avoir téléchargé 'serviceAccountKey.json' et de l'avoir placé dans le dossier du projet.")
        print("[ATTENTION] N'oubliez pas non plus de mettre à jour 'DATABASE_URL' dans le script.")
        exit(1)

def calculate_trend(history):
    """Calcule la tendance (vitesse de montée) du niveau d'eau."""
    if len(history) < 2:
        return 0
    # Calcul de la différence moyenne entre les lectures consécutives
    diffs = [history[i] - history[i-1] for i in range(1, len(history))]
    avg_diff = sum(diffs) / len(diffs)
    return avg_diff

def process_data(event):
    """
    Fonction appelée chaque fois qu'une nouvelle donnée est reçue dans /latestData.
    """
    if event.data is None:
        return

    data = event.data
    # Au cas où l'événement retourne directement une valeur ou un dict partiel
    if isinstance(data, dict) and 'waterLevel' in data:
        water_level = data['waterLevel']
    elif isinstance(data, (int, float)) and event.path == '/waterLevel':
        water_level = data
    else:
        # Données ignorées ou non pertinentes
        return

    print(f"\n--- Nouvelle lecture: Niveau d'eau = {water_level} cm ---")

    # 1. Détection de seuils critiques
    status = "INCONNU"
    if water_level <= SEUIL_NORMAL:
        status = "NORMAL"
    elif water_level >= SEUIL_DANGER:
        status = "DANGER"
    else:
        status = "ATTENTION"  # Entre 20 et 55
    
    print(f"État actuel : {status}")

    # 2. Implémentation d'une logique de prédiction
    water_level_history.append(water_level)
    trend = calculate_trend(water_level_history)
    
    predictive_alert = False
    if len(water_level_history) >= 2:
        print(f"Tendance : {'+' if trend > 0 else ''}{trend:.2f} cm par lecture")
        if trend >= PREDICTION_THRESHOLD:
            print("[ATTENTION] PRÉDICTION : L'eau monte rapidement ! Risque imminent de DANGER.")
            predictive_alert = True
        elif trend < 0:
            print("[INFO] L'eau est en train de descendre.")

    # 3. Mise à jour de Firebase avec l'analyse
    try:
        analysis_ref = db.reference('/analysis')
        analysis_ref.set({
            'status': status,
            'waterLevel': water_level,
            'trend': trend,
            'predictiveAlert': predictive_alert,
            'timestamp': int(time.time() * 1000)
        })
    except Exception as e:
        print(f"Erreur lors de la mise à jour de /analysis: {e}")

def main():
    print("Démarrage du module ADIA (Analyse de Données et IA)...")
    init_firebase()
    
    # On écoute les changements sur le noeud /latestData
    latest_data_ref = db.reference('/latestData')
    
    # Listener en temps réel
    latest_data_ref.listen(process_data)
    
    print("En attente de nouvelles données...")
    try:
        # Garder le script principal actif
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nArrêt du script.")

if __name__ == "__main__":
    main()
