# FluxTriage - Emergency Department Triage Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

A sophisticated, intelligent Emergency Department (ED) triage management system that dynamically prioritizes patients based on **NEWS2 scores** (National Early Warning Score 2), **disease severity**, **waiting time**, **age factors**, and **resource requirements**. Built with a modern tech stack and designed for real-time patient flow optimization in emergency medical settings.

---

## 🏥 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Core Concepts](#-core-concepts)
- [Screenshots](#-screenshots)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Priority Calculation Algorithm](#-priority-calculation-algorithm)
- [Logging & ML Readiness](#-logging--ml-readiness)
- [Disease Database](#-disease-database)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Overview

**FluxTriage** is an advanced triage management system designed to optimize patient flow in busy Emergency Departments. The system uses a sophisticated multi-factor priority algorithm that combines:

- **NEWS2 Score**: Vital signs-based severity assessment (0-20 scale)
- **Severity Index (SI)**: Disease-specific severity classification (1-4 scale)
- **Waiting Time**: Dynamic priority escalation for patients waiting beyond thresholds
- **Age Factor**: Risk adjustment for pediatric (<18) and elderly (>50) patients
- **Resource Score**: Expected resource consumption (1.0-5.0 scale)

The system automatically assigns patients to color-coded triage zones (RED, ORANGE, YELLOW, GREEN), manages treatment bed allocation with capacity constraints, recalculates priorities every 2 minutes, and logs comprehensive time-series data for machine learning analysis.

---

## ✨ Key Features

### 🔥 Intelligent Triage System
- **Automatic Zone Assignment**: Uses NEWS2 and Severity Index to assign patients to appropriate triage zones
- **Dynamic Priority Calculation**: Zone-specific weighted algorithms that balance clinical urgency with fair queue management
- **Real-time Priority Updates**: Automatic recalculation every 2 minutes via cron scheduler
- **Escalation Detection**: Flags patients exceeding maximum wait time thresholds

### 🏥 Treatment Bed Management
- **Zone-Specific Capacity (Adjustable)**: 
  - RED: 5 beds (RED-01 to RED-05)
  - ORANGE: 8 beds (ORANGE-01 to ORANGE-08)
  - YELLOW: 10 beds (YELLOW-01 to YELLOW-10)
  - GREEN: 15 beds (GREEN-01 to GREEN-15)
- **Persistent Bed Assignment**: Each patient receives a fixed bed number stored in database
- **Smart Bed Reuse**: Freed bed numbers are automatically assigned to next patients (e.g., if RED-02 is freed, next patient gets RED-02, not RED-06)
- **Auto-Fill Mechanism**: Runs every 1 minute - automatically assigns waiting patients to available treatment beds based on priority with parallel zone processing
- **Manual Override**: Send patients to treatment manually via API
- **Treatment Time Tracking**: Real-time countdown of remaining treatment time with auto-discharge when time expires

### 📊 Comprehensive Logging
- **Time-Series Patient Logs**: Captures complete patient state at multiple timepoints for ML analysis
- **Event-Based Logging**: Logs on arrival, every 1 minute during priority recalculation, treatment admission, and discharge
- **Audit Trail**: Complete history of priority changes, zone transitions, and bed assignments
- **ML-Ready Data**: Structured format optimized for machine learning model training with 18+ fields per log entry

### 💊 Disease Database
- **51 ICD-10 Coded Diseases**: Comprehensive catalog of common ED presentations
- **Clinical Guidelines**: Treatment times and max wait times based on ACEP/AHRQ standards
- **Searchable Interface**: Fast disease lookup by code, name, or description
- **Manual Entry Support**: Flexibility for unlisted diagnoses

### 📱 Modern UI/UX
- **Real-time Dashboard**: Live KPIs including total patients, average wait time, bed occupancy, and critical cases
- **Zone-Specific Views**: Detailed waiting and treatment queue displays per zone with bed numbers
- **Patient Search**: Search patients by name or phone number with status display (waiting/in treatment) and bed number
- **Patient Inspector**: Comprehensive patient details with vitals, NEWS2 breakdown, and medical history
- **Responsive Design**: Built with Tailwind CSS and Radix UI components

### 🔄 Automated Workflows
- **Priority Scheduler**: Runs every 1 minute via node-cron with 3-step process:
  1. **Auto-discharge** completed treatments (frees beds)
  2. **Priority recalculation** for all waiting patients
  3. **Auto-fill treatment slots** with highest priority patients (parallel zone processing)
- **Persistent Bed Numbers**: Each patient gets a fixed bed number (e.g., RED-01) that stays with them until discharge
- **Smart Bed Reuse**: When a patient is discharged, their bed number is freed and assigned to the next highest-priority patient
- **Parallel Zone Processing**: All 4 zones (RED/ORANGE/YELLOW/GREEN) process independently and simultaneously
- **Data Polling**: Frontend refreshes every 30 seconds to maintain real-time sync

---


## 💡 Core Concepts

### 1. Triage Zones

FluxTriage uses a 4-level color-coded triage system based on the **Emergency Severity Index (ESI)**:

| Zone   | Name         | NEWS2 Range | SI Level | Max Wait Time | Bed Capacity |
|--------|--------------|-------------|----------|---------------|--------------|
| **RED**    | Critical     | 7-20        | 4        | 0-10 min      | 5 beds       |
| **ORANGE** | Urgent       | 5-6         | 3        | 5-90 min      | 8 beds       |
| **YELLOW** | Semi-Urgent  | 2-4         | 2        | 90-120 min    | 10 beds      |
| **GREEN**  | Non-Urgent   | 0-1         | 1        | 180-240 min   | 15 beds      |

**Zone Assignment Logic**:
- Patient's zone is determined by the **higher priority** of NEWS2 zone or SI zone
- Example: If NEWS2 = 3 (YELLOW) but SI = 4 (RED), final zone = **RED**
- Ensures patients are never under-triaged

### 2. NEWS2 Score (National Early Warning Score 2)

NEWS2 is an NHS-approved physiological scoring system (0-20) based on 7 vital signs parameters:

| Parameter              | Range               | Points |
|------------------------|---------------------|--------|
| Respiratory Rate       | ≤8 or ≥25           | 3      |
|                        | 9-11 or 21-24       | 1-2    |
|                        | 12-20               | 0      |
| Oxygen Saturation      | <85%                | 3      |
|                        | 85-93%              | 1-2    |
|                        | ≥94%                | 0      |
| Supplemental Oxygen    | Yes                 | 2      |
|                        | No                  | 0      |
| Systolic BP            | ≤90 or ≥220 mmHg    | 3      |
|                        | 91-110 or 181-219   | 1-2    |
|                        | 111-180             | 0      |
| Heart Rate (Pulse)     | ≤40 or ≥131 bpm     | 3      |
|                        | 41-50 or 111-130    | 1-2    |
|                        | 51-90               | 0      |
| Temperature            | ≤35.0°C or ≥39.1°C  | 2-3    |
|                        | 35.1-36.0 or 38.1-39| 1      |
|                        | 36.1-38.0           | 0      |
| Consciousness (ACVPU)  | C, V, P, U          | 3      |
|                        | A (Alert)           | 0      |

**Clinical Significance**:
- **0-1**: Low risk (GREEN)
- **2-4**: Medium risk (YELLOW)
- **5-6**: High risk (ORANGE)
- **7+**: Critical risk (RED) - NHS threshold for urgent medical review

### 3. Severity Index (SI)

Disease-specific severity classification (1-4 scale):

- **SI 4 (RED)**: Life-threatening (e.g., STEMI, Cardiac Arrest, Stroke)
- **SI 3 (ORANGE)**: Severe/High-risk (e.g., Sepsis, Acute Appendicitis)
- **SI 2 (YELLOW)**: Moderate (e.g., Simple Fracture, UTI)
- **SI 1 (GREEN)**: Minor (e.g., Minor Sprain, Prescription Refill)

### 4. Priority Score Algorithm

Each zone has **optimized weights** for different factors:

```javascript
Priority = (wNEWS2 × NEWS2) + (wSI × SI) + (wT × WaitTime) + (wR × ResourceScore) + (wA × AgeFactor)
```

**Zone-Specific Weights** (optimized through patient flow analysis):

| Zone   | wNEWS2 | wSI    | wT     | wR   | wA     |
|--------|--------|--------|--------|------|--------|
| RED    | 0.01   | 0.0947 | 0.8321 | 0.01 | 0.2222 |
| ORANGE | 0.01   | 0.4324 | 0.8815 | 0.01 | 0.4611 |
| YELLOW | 0.01   | 0.01   | 0.7226 | 0.01 | 0.01   |
| GREEN  | 0.0968 | 0.2717 | 1.0    | 0.01 | 0.0133 |

**Key Insights**:
- **Critical zones (RED/ORANGE)**: Wait time dominates, but age and SI matter
- **Stable zones (YELLOW/GREEN)**: Wait time is primary factor to prevent neglect
- **Wait time modifier**: Only counts after 70% of maxWaitTime to avoid premature escalation

**Age Factor**:
- **High Risk (1)**: Age < 18 or > 50 (vulnerable populations)
- **Low Risk (0)**: Age 18-50 (standard risk)

### 5. Treatment Capacity Management

**Auto-Fill Mechanism**:
1. Runs every 2 minutes via cron scheduler
2. For each zone (RED → ORANGE → YELLOW → GREEN):
   - Count available beds (capacity - occupied)
   - Query waiting patients by priority DESC
   - Assign highest-priority patients to beds
   - Update case status: `WAITING` → `IN_TREATMENT`
3. Logs treatment admission event

**Manual Assignment**:
- Drag-and-drop from waiting queue to specific bed
- Validates zone matching (can't assign RED patient to GREEN zone)
- Updates backend immediately

### 6. Time-Series Logging

**CaseLog Model** captures patient state at multiple timepoints:

- **On Arrival**: Initial triage snapshot
- **Every 2 Minutes**: While status = WAITING (for priority recalculation)
- **On Treatment Admission**: When moved to treatment queue
- **On Discharge**: Final state capture

**Logged Fields** (18 fields per log entry):
- Patient demographics (age, sex)
- Clinical data (NEWS2, SI, vitals breakdown)
- Priority metrics (priority score, zone, escalation flag)
- Temporal data (current_wait_time, total_time_in_system)
- Status transitions (Waiting → Admitted → Discharged)

**Purpose**: Machine learning analysis of:
- Triage effectiveness
- Priority score evolution
- Wait time patterns
- Escalation triggers
- Treatment duration accuracy


---

## 🖼️ Screenshots

### Dashboard View
![Dashboard](Screenshots/Dashboard.png)
*Real-time KPIs: Total patients, avg wait time, bed occupancy, critical cases*

### Patient Inspector
![Patient Inspector](Screenshots/Dashboard(Patient-Search).png)*
*Detailed patient view with vitals, zone assignment, and priority evolution chart*

### Zone View (RED)
![Zone View](Screenshots/Red-Zone-Dashboard.png)
*Waiting queue (left) and treatment beds (right)*

### Zone View (ORANGE)
![Zone View](Screenshots/Orange-Zone-Dashboard.png)
*Similar layout for ORANGE zone with real-time updates*

### Add Patient Form
![Add Patient Form](Screenshots/Patient-Form.png)
*Comprehensive patient registration with vitals input and disease search*

### Disease Dropdown
![Disease Dropdown](Screenshots/Disease-Form.png)
*Auto-suggest disease search with severity and treatment info*

---


---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Dashboard  │  │  Zone Pages  │  │  Patient Forms   │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│         │                 │                   │             │
│         └─────────────────┴───────────────────┘             │
│                           │                                 │
│                   Axios API Client                          │
└───────────────────────────┼─────────────────────────────────┘
                            │
                      HTTP REST API
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Controllers Layer                       │   │
│  │  • TriageController (priority, queues, treatment)    │   │
│  │  • PatientController (CRUD, search)                  │   │
│  │  • DiseaseController (catalog management)            │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                  │
│  ┌───────────────────────┴──────────────────────────────┐   │
│  │               Business Logic Layer                   │   │
│  │  • NEWS2 Calculator (vitals → severity score)        │   │
│  │  • Priority Calculator (multi-factor algorithm)      │   │
│  │  • Zone Assignment (NEWS2 + SI → zone)               │   │
│  │  • Logging Service (time-series data capture)        │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                  │
│  ┌───────────────────────┴──────────────────────────────┐   │
│  │              Prisma ORM Layer                        │   │
│  │  • Patient, PatientCase, Disease, CaseLog models     │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                  │
│  ┌───────────────────────┴──────────────────────────────┐   │
│  │              Cron Scheduler                          │   │
│  │  • Priority Recalculation (every 1 min)              │   │
│  │  • Treatment Slot Filling (every 1 min)              │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   Database Connection
                            │
┌───────────────────────────┼─────────────────────────────────┐
│           PostgreSQL 14 (Docker Container)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database: triage_db                                 │   │
│  │  Tables: Patient, PatientCase, Disease, CaseLog      │   │
│  │  Indexes: Optimized for zone, status, priority       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5.1
- **ORM**: Prisma 6.16 (with Prisma Client)
- **Database**: PostgreSQL 14 (via Docker)
- **Scheduler**: node-cron 4.2 (for automated priority recalculation every 1 minute)
- **CORS**: Enabled for frontend communication

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.3
- **UI Components**: 
  - Radix UI (Accessible component primitives)
  - Tailwind CSS (Utility-first styling)
  - Lucide React (Icons)
- **HTTP Client**: Axios 1.12
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Forms**: React Hook Form 7.55
- **Charts**: Recharts 2.15
- **Notifications**: Sonner (Toast notifications)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Prisma Migrate
- **Development**: Nodemon (hot reload)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **Docker Desktop**: For PostgreSQL database ([Download](https://www.docker.com/products/docker-desktop))
- **Git**: For cloning the repository
- **npm**: Comes with Node.js

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/prajwalmandlecha/FluxTriage.git
cd FluxTriage
```

#### 2. Install Backend Dependencies
```bash
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd Frontend
npm install
cd ..
```

#### 4. Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/triage_db"
PORT=3000
```

#### 5. Start PostgreSQL Database
```bash
# Start PostgreSQL container in detached mode
docker-compose up -d

# Verify container is running
docker ps
```

**Expected output**: Container `triage_db_postgres` should be running on port 5432.

#### 6. Run Database Migrations
```bash
# Apply schema migrations to create tables
npx prisma migrate dev --name init_with_correct_logging

# Generate Prisma Client
npx prisma generate
```

#### 7. Seed the Database
```bash
# Populate disease catalog with 51 ICD-10 coded diseases
npm run seed
```

#### 8. Start the Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

**Backend will run at**: `http://localhost:3000`

#### 9. Start the Frontend Development Server
Open a **new terminal window**:
```bash
cd Frontend
npm run dev
```

**Frontend will run at**: `http://localhost:5173`

#### 10. Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

You should see the FluxTriage dashboard with the home page displaying zone statistics.

---

---


## 📁 Project Structure

```
FluxTriage/
├── src/                                # Backend source code
│   ├── index.js                        # Express server entry point
│   ├── controllers/                    # Business logic controllers
│   │   ├── triageController.js         # Triage queue & priority management
│   │   ├── patientController.js        # Patient CRUD operations
│   │   └── diseaseController.js        # Disease catalog management
│   ├── routes/                         # API route definitions
│   │   ├── triageRoutes.js
│   │   ├── patientRoutes.js
│   │   └── diseaseRoutes.js
│   └── lib/                            # Core utility libraries
│       ├── prisma.js                   # Prisma client singleton
│       ├── news2.js                    # NEWS2 score calculation
│       ├── priority.js                 # Priority algorithm
│       ├── logging.js                  # Time-series logging service
│       └── vitalsMapping.js            # Vitals format conversion
│
├── Frontend/                           # React frontend
│   ├── src/
│   │   ├── App.tsx                     # Main application component
│   │   ├── main.tsx                    # React entry point
│   │   ├── components/                 # React components
│   │   │   ├── HomePage.tsx            # Dashboard with KPIs
│   │   │   ├── ZonePage.tsx            # Zone-specific view
│   │   │   ├── AddPatientForm.tsx      # Patient registration form
│   │   │   ├── PatientCard.tsx         # Waiting queue patient card
│   │   │   ├── TreatmentBedCard.tsx    # Treatment bed display
│   │   │   ├── PatientInspector.tsx    # Patient details modal
│   │   │   ├── Navigation.tsx          # Top navigation bar
│   │   │   └── ui/                     # Radix UI components
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useBackendData.ts       # Backend data fetching & polling
│   │   │   └── useTriageData.ts        # Triage data management
│   │   ├── services/                   # API service layer
│   │   │   └── api.ts                  # Axios API client
│   │   ├── types/                      # TypeScript type definitions
│   │   │   └── patient.ts              # Patient, Zone, Disease types
│   │   ├── utils/                      # Utility functions
│   │   │   ├── heapUtils.ts            # Zone sorting algorithms
│   │   │   └── priorityCalculation.ts  # Frontend NEWS2 calculator
│   │   └── data/                       # Static data
│   │       └── diseaseDatabase.ts      # Frontend disease cache
│   ├── index.html                      # HTML entry point
│   ├── package.json
│   └── vite.config.ts                  # Vite configuration
│
├── prisma/                             # Database configuration
│   ├── schema.prisma                   # Database schema definition
│   ├── seed.js                         # Database seeding script
│   └── migrations/                     # Migration history
│       └── 20251001085652_init_with_correct_logging/
│           └── migration.sql
│
├── docker-compose.yml                  # PostgreSQL container config
├── package.json                        # Backend dependencies
├── .env                                # Environment variables (create this)
│
└── Documentation/
    ├── SCHEMA_RELATIONS.md             # Database relationships & queries
    ├── LOGGING_DATA_SPECIFICATION.md   # ML logging format specification
    ├── DISEASE_DATA_SOURCES.md         # Disease catalog documentation
    └── DOCKER_POSTGRESQL_SETUP.md      # Docker setup guide
```


## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Patient Endpoints

#### Add Patient to ED (Unified Endpoint)
```http
POST /patients/add-to-ed
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1985-05-15",
  "age": 38,
  "gender": "Male",
  "phone": "+1234567890",
  "vitals": {
    "respiratory_rate": 18,
    "oxygen_saturation": 97,
    "supplemental_oxygen": false,
    "temperature": 36.8,
    "systolic_bp": 120,
    "heart_rate": 85,
    "consciousness_level": "ALERT"
  },
  "symptoms": "Chest pain, shortness of breath",
  "diagnosis": "Suspected Myocardial Infarction",
  "diseaseCode": "I21.9",
  "severityIndex": 4,
  "resourceScore": 3.5
}
```

**Response** (201 Created):
```json
{
  "message": "Patient added to ED successfully",
  "patientExists": false,
  "data": {
    "patient": { "id": "clx...", "name": "John Doe", ... },
    "case": { "id": "clx...", "zone": "RED", "priority": 2.45, ... }
  }
}
```

#### Search Patient by Phone
```http
GET /patients/search?phone=+1234567890
```

#### Search Patient by Name
```http
GET /patients/search-by-name?name=John
```

#### Get All Patients
```http
GET /patients
```

#### Get Patient by ID
```http
GET /patients/:id
```

### Triage Endpoints

#### Get Waiting Queues
```http
GET /triage/queues/waiting
```

**Response**:
```json
{
  "message": "Waiting queues fetched successfully",
  "data": {
    "RED": {
      "cases": [...],
      "count": 3
    },
    "ORANGE": { "cases": [...], "count": 5 },
    "YELLOW": { "cases": [...], "count": 8 },
    "GREEN": { "cases": [...], "count": 12 }
  }
}
```

#### Get Treatment Queues
```http
GET /triage/queues/treatment
```

#### Send Patient to Treatment (Manual)
```http
POST /triage/treatment
Content-Type: application/json

{
  "caseId": "clx..."
}
```

#### Discharge Patient
```http
POST /triage/discharge
Content-Type: application/json

{
  "caseId": "clx..."
}
```

#### Update Treatment Duration
```http
POST /triage/treatment/update-duration
Content-Type: application/json

{
  "caseId": "clx...",
  "newDuration": 45
}
```

#### Fill Treatment Slots (Trigger Auto-Fill)
```http
POST /triage/treatment/fill
```

#### Auto-Discharge Completed Treatments
```http
POST /triage/discharge/allCompleted
```

### Disease Endpoints

#### Get All Diseases
```http
GET /diseases
```

#### Search Diseases
```http
GET /diseases?search=cardiac
```

#### Filter by Severity
```http
GET /diseases?severity=4
```

#### Get Disease by Code
```http
GET /diseases/I21.9
```

#### Get Disease Statistics
```http
GET /diseases/stats
```

**Response**:
```json
{
  "total": 51,
  "bySeverity": {
    "1": 8,
    "2": 16,
    "3": 14,
    "4": 13
  },
  "avgTreatmentTime": 95.5,
  "avgMaxWaitTime": 67.2
}
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
Patient (1) ──< (N) PatientCase (N) >── (1) Disease
   │                    │
   │                    │
   └────────────────────┴────────> (N) CaseLog
```

### Core Models

#### Patient
```prisma
model Patient {
  id          String   @id @default(cuid())
  name        String
  age         Int
  gender      Gender
  phone       String
  dateOfBirth String
  cases       PatientCase[]
  logs        CaseLog[]
  
  @@unique([name, dateOfBirth])
  @@index([phone])
}
```

#### PatientCase
```prisma
model PatientCase {
  id                 String      @id @default(cuid())
  zone               Zone        // RED | ORANGE | YELLOW | GREEN
  si                 Int         // Severity Index 1-4
  news2              Int         // NEWS2 score 0-20
  resource_score     Float       // 1.0-5.0
  age                Int
  vitals             Json        // Complete vitals object
  symptoms           String?
  diagnosis          String?
  priority           Float       // Calculated priority score
  treatment_duration Int?
  max_wait_time      Int?
  bed_number         String?     // Assigned bed number (e.g., "RED-01")
  status             CaseStatus  // WAITING | IN_TREATMENT | DISCHARGED
  arrival_time       DateTime
  last_eval_time     DateTime
  time_served        DateTime?
  disease_code       String?
  disease            Disease?    @relation(fields: [disease_code])
  patient_id         String
  patient            Patient     @relation(fields: [patient_id])
  logs               CaseLog[]
  
  @@index([zone, status])
  @@index([priority])
}
```

#### Disease
```prisma
model Disease {
  id             String   @id @default(cuid())
  code           String   @unique  // ICD-10 code
  name           String
  description    String?
  treatment_time Int      // Minutes
  max_wait_time  Int      // Minutes
  severity       Int      // 1-4
  patientCases   PatientCase[]
}
```

#### CaseLog (Time-Series)
```prisma
model CaseLog {
  id                   String   @id @default(cuid())
  patient_id           String
  case_id              String
  timestamp            DateTime @default(now())
  zone                 Zone
  disease_code         String?
  priority             Float
  age                  Int
  sex                  Gender
  SI                   Float
  NEWS2                Int
  respiratory_rate     Int
  spo2                 Int
  o2_device            String
  bp_systolic          Int
  pulse_rate           Int
  consciousness        String
  temperature          Float
  resource_score       Float
  max_wait_time        Int?
  current_wait_time    Int
  total_time_in_system Int
  escalation           Boolean  @default(false)
  treatment_time       Int?
  status               String
  
  @@index([case_id])
  @@index([timestamp])
}
```

### Query Examples

**Get waiting patients in RED zone ordered by priority:**
```javascript
const redPatients = await prisma.patientCase.findMany({
  where: { zone: 'RED', status: 'WAITING' },
  include: { patient: true, disease: true },
  orderBy: { priority: 'desc' }
});
```

**Get patient with full case history:**
```javascript
const patientDetails = await prisma.patient.findUnique({
  where: { id: patientId },
  include: {
    cases: {
      include: { logs: true, disease: true }
    }
  }
});
```

---

## 🧮 Priority Calculation Algorithm

### Implementation Details

**Location**: `src/lib/priority.js`

```javascript
export function calculatePriorityScore(zone, news2, si, waitingMinutes, resourceScore, age, maxWaitTime) {
  const ageFactor = calculateAgeFactor(age);  // 0 or 1
  const weights = priorityWeights[zone];
  
  // Wait time threshold: only count after 70% of maxWaitTime
  let effectiveWaiting = waitingMinutes;
  if (maxWaitTime) {
    const threshold = 0.7 * maxWaitTime;
    effectiveWaiting = waitingMinutes > threshold 
      ? waitingMinutes - threshold 
      : 0;
  }
  
  return (
    weights.wNEWS2 * news2 +
    weights.wSI * si +
    weights.wT * effectiveWaiting +
    weights.wR * resourceScore +
    weights.wA * ageFactor
  );
}
```

### Example Calculations

#### Example 1: Critical Patient (RED Zone)
```javascript
// Patient: 65-year-old with STEMI
zone = "RED"
news2 = 8
si = 4
waitingMinutes = 12
resourceScore = 4.0
age = 65

priority = (0.01 × 8) + (0.0947 × 4) + (0.8321 × 12) + (0.01 × 4.0) + (0.2222 × 1)
         = 0.08 + 0.3788 + 9.9852 + 0.04 + 0.2222
         = 10.71
```

#### Example 2: Stable Patient (GREEN Zone)
```javascript
// Patient: 30-year-old with minor sprain
zone = "GREEN"
news2 = 0
si = 1
waitingMinutes = 45
resourceScore = 1.5
age = 30

priority = (0.0968 × 0) + (0.2717 × 1) + (1.0 × 45) + (0.01 × 1.5) + (0.0133 × 0)
         = 0 + 0.2717 + 45 + 0.015 + 0
         = 45.29
```

### Dynamic Recalculation

**Scheduler**: Runs every 2 minutes via `node-cron`

```javascript
export const startPriorityScheduler = () => {
  cron.schedule('*/2 * * * *', async () => {
    console.log('🔄 Running scheduled priority recalculation...');
    await recalculateAllPriorities();  // Update all WAITING patients
    await fillTreatmentSlots();        // Auto-assign to beds
  });
};
```

**Recalculation Logic**:
1. Fetch all cases with `status = WAITING`
2. For each case:
   - Calculate new `waitingMinutes` from `arrival_time`
   - Recalculate priority score
   - Update `priority` and `last_eval_time`
   - Create new CaseLog entry
3. Check for escalations (`waitingMinutes > max_wait_time`)

---

## 📊 Logging & ML Readiness

### Time-Series Data Structure

**Purpose**: Train machine learning models to:
- Predict optimal triage decisions
- Forecast ED congestion
- Optimize treatment durations
- Detect deterioration patterns

**Logging Frequency**:
- ✅ On patient arrival
- ✅ Every 2 minutes during waiting
- ✅ On treatment admission
- ✅ On discharge

**Sample Log Entry**:
```json
{
  "log_id": "uuid-5678",
  "patient_id": "uuid-4538",
  "case_id": "uuid-7890",
  "timestamp": "2025-10-23T14:30:00Z",
  "zone": "ORANGE",
  "disease_code": "A41.9",
  "priority": 0.85,
  "age": 54,
  "sex": "MALE",
  "SI": 3,
  "NEWS2": 6,
  "respiratory_rate": 22,
  "spo2": 94,
  "o2_device": "Air",
  "bp_systolic": 105,
  "pulse_rate": 110,
  "consciousness": "Alert",
  "temperature": 38.5,
  "resource_score": 3.0,
  "max_wait_time": 30,
  "current_wait_time": 18,
  "total_time_in_system": 18,
  "escalation": false,
  "treatment_time": null,
  "status": "Waiting"
}
```

### ML Use Cases

1. **Triage Optimization**: Train models to predict optimal zone assignments
2. **Wait Time Prediction**: Forecast wait times based on current ED state
3. **Resource Planning**: Predict staffing and bed requirements
4. **Deterioration Detection**: Alert on patients showing declining vitals trends
5. **Treatment Duration Estimation**: Improve accuracy of estimated treatment times

---

## 💊 Disease Database

### Statistics
- **Total Diseases**: 51
- **Data Source**: WHO ICD-10 + ACEP Guidelines
- **Categories**:
  - Zone 4 (Critical): 13 diseases
  - Zone 3 (Urgent): 14 diseases
  - Zone 2 (Semi-Urgent): 16 diseases
  - Zone 1 (Non-Urgent): 8 diseases

### Sample Diseases

| ICD-10 Code | Disease Name                      | Severity | Treatment Time | Max Wait |
|-------------|-----------------------------------|----------|----------------|----------|
| I46.9       | Cardiac Arrest                    | 4        | 60 min         | 0 min    |
| I21.0       | STEMI                             | 4        | 90 min         | 0 min    |
| I63.9       | Cerebral Infarction (Stroke)      | 4        | 120 min        | 0 min    |
| A41.9       | Sepsis                            | 4        | 180 min        | 10 min   |
| K35.80      | Acute Appendicitis                | 3        | 180 min        | 60 min   |
| N10         | Acute Pyelonephritis              | 3        | 180 min        | 90 min   |
| S06.9       | Intracranial Injury (TBI)         | 3        | 240 min        | 30 min   |
| J18.9       | Pneumonia                         | 2        | 180 min        | 120 min  |
| S52.5       | Fracture of Radius/Ulna           | 2        | 90 min         | 90 min   |
| R51         | Headache                          | 1        | 45 min         | 180 min  |

### Seeding Script
```bash
npm run seed
```

**Location**: `prisma/seed.js`


## 👨‍💻 Development Guide

### Running Tests
```bash
# Backend tests (to be implemented)
npm test

# Frontend tests (to be implemented)
cd Frontend
npm test
```

### Database Management

**View Database**:
```bash
# Open Prisma Studio (GUI)
npx prisma studio
```

**Reset Database**:
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate dev --name init
npm run seed
```

**Create Migration**:
```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --name your_migration_name
```

**View Logs**:
```bash
# Backend logs
npm run dev

# Database logs
docker logs -f triage_db_postgres
```

### Code Style

**Backend**:
- ES6+ modules (`import`/`export`)
- Async/await for database operations
- JSDoc comments for complex functions

**Frontend**:
- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling

### Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/triage_db"
PORT=3000
NODE_ENV=development
```

**Frontend** (`vite` automatically loads `.env.local`):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🐛 Troubleshooting

### Issue: Port 5432 already in use

**Solution**:
```bash
# Find process using port 5432
netstat -ano | findstr "5432"

# Stop PostgreSQL service (Windows)
Stop-Service postgresql-x64-14

# Or change port in docker-compose.yml
ports:
  - "5433:5432"
```

### Issue: Docker daemon not running

**Solution**:
1. Open Docker Desktop
2. Wait for it to start (check system tray)
3. Retry `docker-compose up -d`

### Issue: Prisma migration failed

**Solution**:
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d
npx prisma migrate reset --force
npm run seed
```

### Issue: Frontend not connecting to backend

**Checklist**:
1. ✅ Backend running on port 3000: `curl http://localhost:3000/health`
2. ✅ CORS enabled in `src/index.js`
3. ✅ Check browser console for errors
4. ✅ Verify API_BASE_URL in frontend code

### Issue: Priority not updating

**Checklist**:
1. ✅ Cron scheduler started: Check backend logs for "🔄 Running scheduled priority recalculation"
2. ✅ Database connection healthy: `docker ps`
3. ✅ Patient status = WAITING (scheduler only updates waiting patients)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit your changes**: `git commit -m 'Add some feature'`
4. **Push to the branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request**

### Code Standards
- Follow existing code style
- Add JSDoc comments for new functions
- Update README if adding new features
- Test manually before submitting PR
