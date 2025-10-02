# ED Triage Logging Data Specification

## 1. Data to be Stored in Logs

### A. Fields to Log for Each Patient at Each Event

- `log_id`: Auto-generated unique identifier for each log entry
- `patient_id`: Unique patient identifier
- `timestamp`: Date and time of the event or recalculation
- `zone`: Assigned triage zone (e.g., RED, ORANGE, YELLOW, GREEN)
- `disease_code`: Diagnosis or disease code
- `priority`: Computed priority score for triage
- `age`: Patient's age
- `sex`: Patient's sex
- `SI`: Severity Index
- `vitals`: Object containing NEWS2(calculated from vital signs), Respiratory rate, Oxygen saturations (and whether the patient is on air or O₂), Systolic BP, Pulse rate, Level of consciousness (AVPU), Temperature
- `resource_score`: Calculated score representing resource needs
- `max_wait_time`: Maximum permitted wait time for the assigned zone/disease
- `current_wait_time`: Time patient has waited so far (includes patients currently under treatment)
- `total_time_in_system`: Total time from patient arrival to current event (or discharge)
- `escalation`: Boolean indicating if max_wait_time has been exceeded
- `treatment_time`: Time elapsed until treatment started (if applicable)
- `status`: Patient's current status (e.g., Waiting, Admitted, Discharged)

### B. Log Format

#### JSON Example for Each Log Entry
```json
{
    "log_id": "uuid-5678",
    "patient_id": "uuid-4538",
    "timestamp": "2025-09-30T11:00:00Z",
    "zone": "YELLOW",
    "disease_code": "A21",
    "priority": 0.45,
    "age": 41,
    "sex": "F",
    "SI": 0.88,
    "vitals": {
        "NEWS2": 3,
        "respiratory_rate": 18,
        "spo2": 97,
        "o2_device": "Air",
        "bp_systolic": 118,
        "pulse_rate": 98,
        "consciousness": "Alert",
        "temperature": 36.8
    },
    "resource_score": 1.5,
    "max_wait_time": 60,
    "current_wait_time": 15,
    "total_time_in_system": 35,
    "escalation": false,
    "treatment_time": 20,
    "status": "Admitted"
}
```
```json
{
    "log_id": "uuid-9012",
    "patient_id": "uuid-78901",
    "timestamp": "2025-09-30T12:30:00Z",
    "zone": "RED",
    "disease_code": "B12",
    "priority": 0.92,
    "age": 54,
    "sex": "M",
    "SI": 1.10,
    "vitals": {
        "NEWS2": 8,
        "respiratory_rate": 24,
        "spo2": 93,
        "o2_device": "O2",
        "bp_systolic": 105,
        "pulse_rate": 120,
        "consciousness": "Voice",
        "temperature": 38.2
    },
    "resource_score": 3.2,
    "max_wait_time": 10,
    "current_wait_time": 8,
    "total_time_in_system": 33,
    "escalation": false,
    "treatment_time": 25,
    "status": "Discharged"
}
```
```json
{
    "log_id": "uuid-3456",
    "patient_id": "P24680",
    "timestamp": "2025-09-30T10:45:00Z",
    "zone": "GREEN",
    "disease_code": "C34",
    "priority": 0.25,
    "age": 29,
    "sex": "M",
    "SI": 0.75,
    "vitals": {
        "NEWS2": 1,
        "respiratory_rate": 16,
        "spo2": 99,
        "o2_device": "Air",
        "bp_systolic": 120,
        "pulse_rate": 85,
        "consciousness": "Alert",
        "temperature": 36.5
    },
    "resource_score": 0.8,
    "max_wait_time": 120,
    "current_wait_time": 30,
    "total_time_in_system": 30,
    "escalation": false,
    "treatment_time": null,
    "status": "Waiting"
}
```

#### SQL/Prisma Table Example
| Field                | Type                |
|----------------------|---------------------|
| log_id               | UUID                |
| patient_id           | UUID                |
| timestamp            | TIMESTAMP           |
| zone                 | VARCHAR             |
| disease_code         | VARCHAR             |
| priority             | FLOAT               |
| age                  | INTEGER             |
| sex                  | VARCHAR             |
| SI                   | FLOAT               |
| NEWS2                | INTEGER             |
| respiratory_rate     | INTEGER             |
| spo2                 | INTEGER             |
| o2_device            | VARCHAR             |
| bp_systolic          | INTEGER             |
| pulse_rate           | INTEGER             |
| consciousness        | VARCHAR             |
| temperature          | FLOAT               |
| resource_score       | FLOAT               |
| max_wait_time        | INTEGER             |
| current_wait_time    | INTEGER             |
| total_time_in_system | INTEGER             |
| escalation           | BOOLEAN             |
| treatment_time       | INTEGER (nullable)  |
| status               | VARCHAR             |

### C. When to Log
- On every priority recalculation (e.g., every 2 minutes)
- On patient arrival
- On treatment(when inserted in treatment queue/discharge(removed from treatment queue))

