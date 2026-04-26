# Firebase Database Structure

This project uses **Firebase Realtime Database** to store the sensor data sent from the ESP32/Wokwi simulation.

The ESP32 sends data in real time to Firebase. These data can then be used by the dashboard, the mobile application, or the AI/prediction part of the project.

---

## 1. `latestData`

This path stores the **latest sensor values** received from the ESP32.

It is mainly used by the dashboard to display the current state of the system in real time.

### Example

```json
{
  "temperature": 28.5,
  "humidity": 65,
  "waterLevel": 72,
  "motion": false,
  "alert": "Normal"
}
```

### Usage

- Real-time dashboard display
- Current water level
- Current temperature and humidity
- Current motion/object detection status
- Current system alert state

---

## 2. `readings`

This path stores the **history of all sensor measurements**.

Each new measurement is saved as a new record. This data can be used later for graphs, statistics, reports, or AI prediction.

### Example

```json
{
  "-Nx123": {
    "temperature": 28.5,
    "humidity": 65,
    "waterLevel": 72,
    "motion": false,
    "alert": "Normal"
  },
  "-Nx124": {
    "temperature": 29.0,
    "humidity": 68,
    "waterLevel": 80,
    "motion": false,
    "alert": "Alerte risque d'inondation"
  }
}
```

### Usage

- Historical data storage
- Charts and curves
- Statistics
- AI model training or prediction
- Project report results

---

## 3. `alerts`

This path stores only the **alert events** detected by the system.

An alert is saved when:

- the water level exceeds the defined threshold
- an object/motion is detected by the PIR sensor

### Example

```json
{
  "-Nx456": {
    "temperature": 29,
    "humidity": 70,
    "waterLevel": 85,
    "motion": false,
    "alert": "Alerte risque d'inondation"
  },
  "-Nx457": {
    "temperature": 27,
    "humidity": 63,
    "waterLevel": 45,
    "motion": true,
    "alert": "Alerte detection objet"
  }
}
```

### Usage

- Alert history
- Dashboard alert section
- Notification system
- Risk monitoring

---

## Summary

| Firebase Path | Role |
|---|---|
| `/latestData` | Stores the latest received data for real-time display |
| `/readings` | Stores the full history of all measurements |
| `/alerts` | Stores only detected alerts |

---

## Important Security Note

Do **not** upload private Firebase files to GitHub, especially:

- `serviceAccountKey.json`
- `.env`
- private keys
- passwords

The Firebase Realtime Database URL can be shared with the team if needed, but the database rules must be secured before final deployment.
