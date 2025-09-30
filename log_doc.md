# ED Patient Log & ML Model Data Specification (Unified)

This document defines the unified, finalized structure for logging patient data and the requirements for the ML model in the ED management system.

---

## 1. Log Structure: Array of Updates per Patient Case

For each patient case, maintain an array of updates. Each update is logged at every vitals update or priority recalculation (e.g., every 2 minutes):

| Field                | Description                                                      |
|----------------------|------------------------------------------------------------------|
| timestamp            | Time of update (ISO format)                                      |
| vitals_json          | JSON object with all current raw and structured vitals           |
| news2                | Current NEWS2 score                                              |
| si                   | Current Shock Index                                              |
| resourceScore        | Current resource score                                           |
| priority             | Current calculated priority value                                |
| waiting_time         | Minutes since arrival                                            |
| rank_in_queue        | Position in waiting queue after recalculation                    |
| status               | Current status (WAITING, IN_TREATMENT, DISCHARGED)              |

**Case-level fields (static or updated at key events):**

| Field                | Description                                                      |
|----------------------|------------------------------------------------------------------|
| patient_id           | Unique identifier for the patient                                |
| case_id              | Unique identifier for the patient case                           |
| zone                 | Current zone (RED, ORANGE, YELLOW, GREEN)                        |
| age                  | Patient's age                                                    |
| ageFactor            | Age factor (1 if age ≥65 or ≤15, else 0)                         |
| arrival_time         | Patient's arrival time                                           |
| disease_code         | Disease code (if relevant)                                       |
| treatment_start_time | When treatment begins                                            |
| treatment_end_time   | When treatment ends                                              |
| total_time_in_ED     | Total time from arrival to discharge (minutes)                   |
| escalation           | Boolean/event: did the patient move to a higher zone?            |
| outcome              | Outcome label (e.g., recovered, adverse event, etc.)             |

**Note:**
- Log a new update entry every time vitals or priority are recalculated.
- If new parameters or vitals are added, include them in `vitals_json` and document them here.

---

## 2. Example Log Entry (JSON)

```json
{
  "patient_id": "123",
  "case_id": "456",
  "zone": "ORANGE",
  "age": 70,
  "ageFactor": 1,
  "arrival_time": "2025-09-30T12:00:00Z",
  "disease_code": "A01",
  "treatment_start_time": "2025-09-30T12:10:00Z",
  "treatment_end_time": "2025-09-30T12:40:00Z",
  "total_time_in_ED": 40,
  "escalation": true,
  "outcome": "recovered",
  "updates": [
    {
      "timestamp": "2025-09-30T12:00:00Z",
      "vitals_json": { "heart_rate": 90, "spo2": 98 },
      "news2": 6,
      "si": 3,
      "resourceScore": 2,
      "priority": 8.2,
      "waiting_time": 0,
      "rank_in_queue": 2,
      "status": "WAITING"
    },
    {
      "timestamp": "2025-09-30T12:02:00Z",
      "vitals_json": { "heart_rate": 92, "spo2": 97 },
      "news2": 7,
      "si": 4,
      "resourceScore": 3,
      "priority": 9.1,
      "waiting_time": 2,
      "rank_in_queue": 1,
      "status": "WAITING"
    }
    // ...more updates
  ]
}
```

---

## 3. Data Required by the ML Model

The ML model should use:
- The full time series of updates (vitals, priority, waiting_time, rank_in_queue, status, etc.) for each patient case.
- Case-level fields (zone, age, disease_code, escalation, outcome, treatment times, total_time_in_ED, etc.).
- All static and dynamic features to learn zone-specific weights and the impact of parameter changes over time.
- If new parameters are added to the priority calculation, ensure the ML model is updated to learn weights for these as well.

---

## 4. Notes
- Log every vitals update and key event for maximum data granularity.
- The more complete and granular the logs, the better the ML model can optimize the weights.
- Regularly update the ML model with new data to adapt to changes in patient flow and ED practices.
- If you add new fields or parameters, update this documentation and ensure they are included in both logs and ML model input.
