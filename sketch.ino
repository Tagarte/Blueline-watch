#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// ================== Définition des pins ==================
#define DHTPIN 15
#define DHTTYPE DHT22

#define TRIG_PIN 5
#define ECHO_PIN 18

#define PIR_PIN 19

#define BUZZER_PIN 23
#define LED_PIN 2

// ================== Objets ==================
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================== Paramètres ==================
const int TANK_HEIGHT_CM = 100;
const int WATER_ALERT_PERCENT = 75;

unsigned long lastDisplayTime = 0;
const unsigned long DISPLAY_INTERVAL = 5000;

bool motionAlertActive = false;
unsigned long motionAlertStart = 0;
const unsigned long MOTION_ALERT_DURATION = 3000;

bool waterAlertActive = false;

bool systemReady = false;
unsigned long startTime = 0;

// ================== Fonctions buzzer ==================
void buzzerOn(int frequency) {
  tone(BUZZER_PIN, 500,1000);
}

void buzzerOff() {
  noTone(BUZZER_PIN);
}

// ================== Fonction mesure distance ==================
float readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1;
  }

  float distance = duration * 0.034 / 2;
  return distance;
}

// ================== Fonction niveau d'eau ==================
int calculateWaterLevel(float distanceCM) {
  if (distanceCM < 0) {
    return -1;
  }

  int level = map(distanceCM, TANK_HEIGHT_CM, 0, 0, 100);

  if (level < 0) level = 0;
  if (level > 100) level = 100;

  return level;
}

// ================== Setup ==================
void setup() {
  Serial.begin(115200);

  dht.begin();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(PIR_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  buzzerOff();
  digitalWrite(LED_PIN, LOW);

  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("Blue Line Watch");
  lcd.setCursor(0, 1);
  lcd.print("Initialisation");

  Serial.println("=================================");
  Serial.println("Projet : Blue Line Watch");
  Serial.println("Systeme en cours d'initialisation...");
  Serial.println("Attendez quelques secondes.");
  Serial.println("=================================");

  startTime = millis();
}

// ================== Loop ==================
void loop() {
  unsigned long currentTime = millis();

  // Éviter les fausses alertes au démarrage
  if (!systemReady && currentTime - startTime >= 3000) {
    systemReady = true;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Systeme pret");
    lcd.setCursor(0, 1);
    lcd.print("Surveillance");

    Serial.println("Systeme pret.");
    Serial.println("Clique sur 'Simulate Motion' pour declencher l'alerte mouvement.");
    Serial.println("=================================");
  }

  if (!systemReady) {
    buzzerOff();
    digitalWrite(LED_PIN, LOW);
    return;
  }

  // ================== Lecture capteur mouvement ==================
  int pirState = digitalRead(PIR_PIN);

  if (pirState == HIGH && !motionAlertActive) {
    motionAlertActive = true;
    motionAlertStart = currentTime;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ALERTE !");
    lcd.setCursor(0, 1);
    lcd.print("DETECTION OBJET");

    Serial.println("ALERTE : DETECTION OBJET !");
  }

  // Fin de l'alerte mouvement après 3 secondes
  if (motionAlertActive && currentTime - motionAlertStart >= MOTION_ALERT_DURATION) {
    motionAlertActive = false;

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Surveillance");
    lcd.setCursor(0, 1);
    lcd.print("Mode normal");

    Serial.println("Fin de l'alerte mouvement.");
    Serial.println("=================================");
  }

  // ================== Lecture données chaque 5 secondes ==================
  if (currentTime - lastDisplayTime >= DISPLAY_INTERVAL) {
    lastDisplayTime = currentTime;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    float distance = readDistanceCM();
    int waterLevel = calculateWaterLevel(distance);

    if (waterLevel != -1 && waterLevel >= WATER_ALERT_PERCENT) {
      waterAlertActive = true;
    } else {
      waterAlertActive = false;
    }

    // ================== Serial Monitor ==================
    Serial.println("------ Donnees Blue Line Watch ------");

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Erreur lecture DHT22 !");
    } else {
      Serial.print("Temperature : ");
      Serial.print(temperature);
      Serial.println(" C");

      Serial.print("Humidite : ");
      Serial.print(humidity);
      Serial.println(" %");
    }

    if (waterLevel == -1) {
      Serial.println("Erreur lecture capteur niveau d'eau !");
    } else {
      Serial.print("Distance mesuree : ");
      Serial.print(distance);
      Serial.println(" cm");

      Serial.print("Niveau d'eau : ");
      Serial.print(waterLevel);
      Serial.println(" %");

      if (waterAlertActive) {
        Serial.println("ALERTE : Niveau d'eau eleve !");
      } else {
        Serial.println("Niveau d'eau normal.");
      }
    }

    if (pirState == HIGH) {
      Serial.println("Mouvement : DETECTE");
    } else {
      Serial.println("Mouvement : Aucun");
    }

    Serial.println("-------------------------------------");

    // ================== LCD ==================
    if (!motionAlertActive) {
      lcd.clear();

      if (!isnan(temperature) && !isnan(humidity)) {
        lcd.setCursor(0, 0);
        lcd.print("T:");
        lcd.print(temperature, 1);
        lcd.print("C H:");
        lcd.print(humidity, 0);
        lcd.print("%");
      } else {
        lcd.setCursor(0, 0);
        lcd.print("Erreur DHT22");
      }

      lcd.setCursor(0, 1);

      if (waterLevel != -1) {
        lcd.print("Eau:");
        lcd.print(waterLevel);
        lcd.print("% ");

        if (waterAlertActive) {
          lcd.print("ALERT");
        } else {
          lcd.print("OK");
        }
      } else {
        lcd.print("Erreur niveau");
      }
    }
  }

  // ================== Gestion finale LED + Buzzer ==================
  // La LED et le buzzer sont actifs seulement si une alerte existe

  bool alertActive = motionAlertActive || waterAlertActive;

  if (alertActive) {
    digitalWrite(LED_PIN, HIGH);

    if (motionAlertActive) {
      buzzerOn(1000);   // son pour détection objet
    } else if (waterAlertActive) {
      buzzerOn(1200);   // son pour niveau d'eau élevé
    }

  } else {
    digitalWrite(LED_PIN, LOW);
    buzzerOff();
  }
}