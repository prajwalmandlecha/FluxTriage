# Disease Data Sources

This document details the official sources used to populate the disease database.

## Official Data Sources

### Primary Sources

1. **WHO International Classification of Diseases (ICD-10)**

   - All disease codes follow the ICD-10 standard maintained by the World Health Organization
   - Source: https://www.who.int/classifications/icd/en/

2. **Emergency Severity Index (ESI)**

   - Severity classifications (1-4 scale) based on ESI triage algorithm
   - Developed by the Agency for Healthcare Research and Quality (AHRQ)
   - Source: https://www.ahrq.gov/

3. **American College of Emergency Physicians (ACEP)**

   - Treatment time guidelines and maximum wait time recommendations
   - Based on ACEP clinical practice guidelines

4. **CDC (Centers for Disease Control and Prevention)**
   - Epidemiological data and disease statistics
   - Source: https://www.cdc.gov/

## Severity Scale

The severity scale is merged into four levels, based on the Emergency Severity Index:

- **Critical**: Life-threatening conditions requiring immediate intervention  
   - Examples: Cardiac arrest, STEMI, severe trauma, anaphylactic shock  
   - Max wait time: 0 minutes
   - SI: 4

- **Urgent**: High-risk or severe symptoms needing prompt attention  
   - Examples: Stroke, sepsis, severe respiratory distress, appendicitis, renal colic  
   - Max wait time: 5-90 minutes
   - SI: 3

- **Less Urgent**: Stable conditions, moderate symptoms  
   - Examples: Minor sprains, simple lacerations, mild headache, moderate injuries  
   - Max wait time: 90-120 minutes
   - SI: 2

- **Low Care**: Minimal resources needed, non-urgent  
   - Examples: Prescription refills, minor viral infections  
   - Max wait time: 180-240 minutes
   - SI: 1

## Treatment Time Guidelines

Treatment times are based on:

1. **Time-Critical Conditions**:

   - STEMI: 90 minutes (door-to-balloon time per AHA guidelines)
   - Stroke: 120 minutes (door-to-needle time for tPA)
   - Sepsis: 180 minutes (first hour bundle per Surviving Sepsis Campaign)

2. **Surgical Conditions**:

   - Include time for surgical consultation, imaging, and procedure
   - Based on average ED to OR times

3. **Medical Conditions**:
   - Time for assessment, diagnostics, treatment, and observation
   - Based on typical ED length of stay data

## Disease Categories in Database

### Total: 51 Diseases

#### By Severity Zone (ESI-based 4-level scale):

- **Zone 4 (Critical)**: 13 diseases  
   Life-threatening conditions requiring immediate intervention  
   Examples: Cardiac arrest, STEMI, severe trauma, anaphylactic shock

- **Zone 3 (Urgent)**: 14 diseases  
   High-risk or severe symptoms needing prompt attention  
   Examples: Stroke, sepsis, severe respiratory distress, appendicitis, renal colic

- **Zone 2 (Less Urgent)**: 16 diseases  
   Stable conditions, moderate symptoms  
   Examples: Minor sprains, simple lacerations, mild headache, moderate injuries

- **Zone 1 (Low Care)**: 8 diseases  
   Minimal resources needed, non-urgent  
   Examples: Prescription refills, minor viral infections

#### By System:

- **Cardiovascular**: 10 diseases (MI, cardiac arrest, heart failure, etc.)
- **Respiratory**: 6 diseases (pneumonia, asthma, COPD, etc.)
- **Gastrointestinal**: 6 diseases (appendicitis, GI bleed, obstruction, etc.)
- **Infectious**: 5 diseases (sepsis, bacterial/viral infections, etc.)
- **Neurological**: 4 diseases (seizures, TIA, hemorrhage, etc.)
- **Trauma**: 4 diseases (TBI, fractures, pneumothorax, etc.)
- **Metabolic**: 3 diseases (DKA, hypoglycemia, electrolyte issues, etc.)
- **Renal**: 3 diseases (AKI, pyelonephritis, renal colic, etc.)
- **Other**: 10 diseases (allergic reactions, psychiatric, minor conditions, etc.)

## Sample Critical Conditions (Zone 4)

| ICD-10 Code | Disease Name                 | Treatment Time | Max Wait |
| ----------- | ---------------------------- | -------------- | -------- |
| I46.9       | Cardiac Arrest               | 60 min         | 0 min    |
| I21.0       | STEMI                        | 90 min         | 0 min    |
| I21.9       | Acute Myocardial Infarction  | 90 min         | 0 min    |
| I63.9       | Cerebral Infarction (Stroke) | 120 min        | 0 min    |
| I61.9       | Intracerebral Hemorrhage     | 180 min        | 0 min    |
| I60.9       | Subarachnoid Hemorrhage      | 180 min        | 0 min    |
| J96.00      | Acute Respiratory Failure    | 120 min        | 5 min    |
| J81.0       | Acute Pulmonary Edema        | 120 min        | 5 min    |
| A41.9       | Sepsis                       | 180 min        | 10 min   |
| R65.20      | Severe Sepsis                | 180 min        | 10 min   |
| T78.2XXA    | Anaphylactic Shock           | 60 min         | 0 min    |
| T79.4XXA    | Traumatic Shock              | 90 min         | 0 min    |
| G40.911     | Status Epilepticus           | 90 min         | 0 min    |

## Methodology

1. **Selection Criteria**:
    - Common emergency department presentations
    - Range of severity zones (1-4)
    - Diverse body systems
    - Mix of time-critical and routine conditions

2. **Data Validation**:
    - All ICD-10 codes verified against WHO ICD-10 database
    - Treatment times based on published clinical guidelines
    - Severity zones aligned with ESI triage protocols

3. **Updates**:
    - Data should be reviewed annually
    - Treatment guidelines updated as new evidence emerges
    - ICD-10 codes updated with new releases

## Usage

To seed/reseed the database with this data:

```bash
npm run seed
```

Or with Prisma directly:

```bash
npx prisma db seed
```

## API Access

Once seeded, diseases can be accessed via the API:

```bash
# Get all diseases
GET /api/diseases

# Search for diseases
GET /api/diseases?search=heart

# Filter by severity zone
GET /api/diseases?zone=4

# Get specific disease
GET /api/diseases/{ICD-10-code}

# Get statistics
GET /api/diseases/stats
```

## References

1. World Health Organization. (2019). International Classification of Diseases, 10th Revision (ICD-10).
2. Agency for Healthcare Research and Quality. Emergency Severity Index (ESI): A Triage Tool for Emergency Departments.
3. American College of Emergency Physicians. Clinical Practice Guidelines.
4. American Heart Association. Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care.
5. Surviving Sepsis Campaign. International Guidelines for Management of Sepsis and Septic Shock.
6. American Stroke Association. Guidelines for the Early Management of Patients With Acute Ischemic Stroke.

## Notes

⚠️ **Important**: This data is for educational/demonstration purposes. Real-world clinical decisions should be based on:

- Current medical practice standards
- Individual patient assessment
- Local facility protocols
- Clinical judgment

Treatment times and severity zones are guidelines and may vary based on:

- Patient complexity
- Available resources
- Co-morbidities
- Facility capabilities
