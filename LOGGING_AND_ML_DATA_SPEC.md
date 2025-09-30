# ED Triage Logging & ML Pipeline Data Specification

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
- `vitals`: Object containing NEWS2, SI, heart_rate, bp_systolic, bp_diastolic, spo2, temperature
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
    "vitals": {
        "NEWS2": 3,
        "SI": 0.88,
        "heart_rate": 98,
        "bp_systolic": 118,
        "bp_diastolic": 76,
        "spo2": 97,
        "temperature": 36.8
    },
    "resource_score": 1.5,
    "max_wait_time": 60,
    "current_wait_time": 15,
    "treatment_time": 20,
    "total_time_in_system": 35,
    "escalation": false,
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
    "vitals": {
        "NEWS2": 8,
        "SI": 1.10,
        "heart_rate": 120,
        "bp_systolic": 105,
        "bp_diastolic": 65,
        "spo2": 93,
        "temperature": 38.2
    },
    "resource_score": 3.2,
    "max_wait_time": 10,
    "current_wait_time": 8,
    "treatment_time": 25,
    "total_time_in_system": 33,
    "escalation": false,
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
    "vitals": {
        "NEWS2": 1,
        "SI": 0.75,
        "heart_rate": 85,
        "bp_systolic": 120,
        "bp_diastolic": 80,
        "spo2": 99,
        "temperature": 36.5
    },
    "resource_score": 0.8,
    "max_wait_time": 120,
    "current_wait_time": 30,
    "treatment_time": null,
    "total_time_in_system": 30,
    "escalation": false,
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
| NEWS2                | INTEGER             |
| SI                   | FLOAT               |
| heart_rate           | INTEGER             |
| bp_systolic          | INTEGER             |
| bp_diastolic         | INTEGER             |
| spo2                 | INTEGER             |
| temperature          | FLOAT               |
| resource_score       | FLOAT               |
| max_wait_time        | INTEGER             |
| current_wait_time    | INTEGER             |
| treatment_time       | INTEGER (nullable)  |
| total_time_in_system | INTEGER             |
| escalation           | BOOLEAN             |
| status               | VARCHAR             |

### C. When to Log
- On every priority recalculation (e.g., every 2 minutes)
- On patient arrival
- On escalation (max_wait_time exceeded)
- On treatment/discharge


## 2. Data Required by the ML / ETL Pipeline

| Field                   | Type      | Use                         |
|-------------------------|-----------|-----------------------------|
| timestamp               | TIMESTAMP | Age & label horizon         |
| zone                    | VARCHAR   | Stratify models             |
| disease_code            | VARCHAR   | Look-up max_wait_time       |
| max_wait_time           | INTEGER   | Breach threshold            |
| current_wait_time       | INTEGER   | Feature + label             |
| escalation              | BOOLEAN   | Ground-truth breach         |
| NEWS2                   | INTEGER   | Model feature               |
| SI                      | FLOAT     | Model feature               |
| resource_score          | FLOAT     | Model feature               |
| age                     | INTEGER   | Derive ageFactor            |
| sex                     | VARCHAR   | Optional for fairness audit |
| vitals.heart_rate, etc. | INTEGER   | Engineer trends if needed   |

