# Prisma Schema - Relationship Documentation (2025 Update)

## Entity Relationship Diagram

```
┌──────────────┐
│   Patient    │
│              │
│ - id (PK)    │
│ - name       │
│ - age        │
│ - gender     │
│ - phone      │
│ - dateOfBirth│
└──────┬───────┘
       │
       │ 1:N (Cascade on delete)
       │
       ├─────────────────────────────────────┐
       │                                     │
       │                                     │
       ▼                                     ▼
┌─────────────────────┐                    ┌───────────────────────┐
│ PatientCase         │                    │   CaseLog             │
│                     │                    │                       │
│ - id (PK)           │                    │ - id (PK)             │
│ - zone              │                    │ - patient_id          │
│ - si                │◄───────────────────┤ - case_id             │
│ - news2             │  1:N (Cascade)     │ - timestamp           │
│ - priority          │                    │ - zone                │
│ - status            │                    │ - disease_code        │
│ - patient_id        │                    │ - priority            │
│ - disease_code      │                    │ - age                 │
│ - vitals            │                    │ - sex                 │
│ - symptoms          │                    │ - SI                  │
│ - diagnosis         │                    │ - NEWS2               │
│ - resource_score    │                    │ - respiratory_rate    │
│ - treatment_duration│                    │ - spo2                │
│ - max_wait_time     │                    │ - o2_device           │
│ - arrival_time      │                    │ - bp_systolic         │
│ - last_eval_time    │                    │ - pulse_rate          │
│ - time_served       │                    │ - consciousness       │
└──────┬──────────────┘                    │ - temperature         │
       │                                   │ - resource_score      │
       │ N:1 (SetNull on delete)           │ - max_wait_time       │
       ▼                                   │ - current_wait_time   │
┌─────────────────┐                        │ - total_time_in_system│
│   Disease       │                        │ - escalation          │
│                 │                        │ - treatment_time      │
│ - id (PK)       │                        │ - status              │
│ - code (UK)     │                        └───────────────────────┘
│ - name          │
│ - description   │
│ - treatment_time│
│ - max_wait_time │
│ - severity      │
└─────────────────┘
```

## Relationship Breakdown

### Patient ↔ PatientCase (One-to-Many, Cascade)
- Patient has many PatientCases (`cases`)
- PatientCase references Patient (`patient_id`)
- Deleting Patient cascades to PatientCases

### Patient ↔ CaseLog (One-to-Many, Cascade)
- Patient has many CaseLogs (`logs`)
- CaseLog references Patient (`patient_id`)
- Deleting Patient cascades to CaseLogs

### PatientCase ↔ CaseLog (One-to-Many, Cascade)
- PatientCase has many CaseLogs (`logs`)
- CaseLog references PatientCase (`case_id`)
- Deleting PatientCase cascades to CaseLogs

### Disease ↔ PatientCase (One-to-Many, SetNull)
- Disease has many PatientCases (`patientCases`)
- PatientCase references Disease (`disease_code`)
- Deleting Disease sets `disease_code` to NULL in PatientCase

## Index Strategy

### Patient
- `@@unique([name, dateOfBirth])`
- `@@index([phone])`
- `@@index([name])`

### PatientCase
- `@@index([zone, status])`
- `@@index([patient_id])`
- `@@index([time_served])`
- `@@index([priority])`

### CaseLog
- `@@index([case_id])`
- `@@index([patient_id])`
- `@@index([timestamp])`

## Data Integrity Rules

1. Every PatientCase MUST have a Patient (cascade on delete)
2. Every CaseLog MUST have both Patient and PatientCase (cascade on delete)
3. PatientCase can exist without Disease (disease_code is optional)
4. Deleting Patient cleans up everything (cases → logs)
5. Deleting Disease preserves cases (disease_code set to NULL)

## Cascade Delete Summary

| Action | Effect |
|--------|--------|
| Delete **Patient** | Deletes all **PatientCases** → Deletes all **CaseLogs** |
| Delete **PatientCase** | Deletes its **CaseLogs** |
| Delete **CaseLog** | No effect on other tables |
| Delete **Disease** | Sets **disease_code** to NULL in cases |

## Query Patterns

### Get all cases for a patient with their logs
```typescript
const patientWithCases = await prisma.patient.findUnique({
  where: { id: patientId },
  include: {
    cases: {
      include: {
        logs: true,
        disease: true
      }
    }
  }
});
```

### Get waiting patients in RED zone ordered by priority
```typescript
const redPatients = await prisma.patientCase.findMany({
  where: {
    zone: 'RED',
    status: 'WAITING'
  },
  include: {
    patient: true,
    logs: true
  },
  orderBy: {
    priority: 'desc'
  }
});
```

### Get case with full details
```typescript
const caseDetails = await prisma.patientCase.findUnique({
  where: { id: caseId },
  include: {
    patient: true,
    disease: true,
    logs: true
  }
});
```

## ✅ Relation Checklist

- [x] Patient → PatientCase (1:N with Cascade)
- [x] Patient → CaseLog (1:N with Cascade)
- [x] PatientCase → Patient (N:1 with Cascade)
- [x] PatientCase → Disease (N:1 with SetNull)
- [x] PatientCase → CaseLog (1:N TIME-SERIES with Cascade)
- [x] CaseLog → Patient (N:1 with Cascade)
- [x] CaseLog → PatientCase (N:1 with Cascade)
- [x] Disease → PatientCase (1:N with SetNull)
