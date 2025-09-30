# Log Data Specification for ML-Driven Priority Weight Optimization

This document describes the data that should be logged by the system and the data required by the ML model to optimize the dynamic weights for patient priority calculation in the Emergency Department (ED) management system.

---

## 1. Data to Log for Each Patient Case

For every patient and at every priority recalculation (or at key events), log the following fields:

| Field              | Description                                                      |
|--------------------|------------------------------------------------------------------|
| patient_id         | Unique identifier for the patient                                |
| case_id            | Unique identifier for the patient case                           |
| timestamp          | Time of log entry (ISO format)                                   |
| zone               | Current zone (RED, ORANGE, YELLOW, GREEN)                        |
| news2              | Current NEWS2 score                                              |
| si                 | Current Shock Index                                              |
| resourceScore      | Current resource score                                           |
| age                | Patient's age                                                    |
| ageFactor          | Age factor (1 if age ≥65 or ≤15, else 0)                         |
| arrival_time       | Patient's arrival time                                           |
| last_eval_time     | Last time priority was recalculated                              |
| time_waited        | Minutes since arrival                                            |
| disease_code       | Disease code (if relevant)                                       |
| status             | Current status (WAITING, IN_TREATMENT, DISCHARGED)               |
| priority           | Current calculated priority value                                |
| treatment_duration | Duration of treatment (if in treatment)                          |
| time_served        | Time when patient was discharged                                 |
| escalation         | Boolean/event: did the patient move to a higher zone?            |
| outcome            | Outcome label (e.g., recovered, adverse event, etc.)             |

---

## 2. Data Required by the ML Model

The ML model requires the following data for effective weight optimization:

- All log fields listed above, for as many historical cases as possible.
- For each log entry, the outcome or label to optimize for, such as:
  - Was the patient escalated? (and was it timely?)
  - Was the patient treated in time?
  - Did the patient have a good or adverse outcome?
  - How long did the patient wait in each zone?
- Zone-specific data, so the model can learn different weights for each zone.
- Sufficient data to correlate parameter values and weights with outcomes (i.e., the effectiveness of current weights).

---

## 3. Example Log Entry (JSON)

```json
{
  "patient_id": "123",
  "case_id": "456",
  "timestamp": "2025-09-30T12:34:56Z",
  "zone": "ORANGE",
  "news2": 6,
  "si": 3,
  "resourceScore": 2,
  "age": 70,
  "ageFactor": 1,
  "arrival_time": "2025-09-30T12:00:00Z",
  "last_eval_time": "2025-09-30T12:34:00Z",
  "time_waited": 34,
  "disease_code": "A01",
  "status": "IN_TREATMENT",
  "priority": 8.2,
  "treatment_duration": 30,
  "time_served": "2025-09-30T13:04:00Z",
  "escalation": false,
  "outcome": "recovered"
}
```

---

## 4. Notes

- Log every recalculation and key event for maximum data granularity.
- The more complete and granular the logs, the better the ML model can optimize the weights.
- Regularly update the ML model with new data to adapt to changes in patient flow and ED practices.
