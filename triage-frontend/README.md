# Hospital Triage System Frontend

A beautiful, modern React TypeScript frontend for the Hospital Triage System backend.

## Features

### 🏥 **Real-time Triage Dashboard**

- **Live Queue Monitoring** - Auto-refreshing every 10 seconds
- **Zone-based Organization** - RED, ORANGE, YELLOW, GREEN priority zones
- **Patient Case Management** - Create, view, and manage patient cases
- **Treatment Workflow** - Send patients to treatment and discharge

### 🎨 **Modern UI/UX**

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Color-coded Zones** - Visual priority system with medical-standard colors
- **Real-time Updates** - Auto-refresh with manual refresh option
- **Interactive Cards** - Click to send to treatment or discharge patients

### 📊 **Comprehensive Patient Management**

- **Patient Registration** - Create new patients with medical history
- **Triage Assessment** - NEWS2 and Severity Index scoring
- **Queue Statistics** - Real-time counts and capacity monitoring
- **Priority Calculation** - Automatic priority scoring with age factors

## Quick Start

### Prerequisites

- Node.js 16+
- Backend server running on `http://localhost:3000`

### Installation

```bash
cd triage-frontend
npm install
npm start
```

The frontend will start on `http://localhost:3001` and proxy API calls to the backend.

## Usage

### 1. **Create Patients**

- Click "New Patient" button
- Fill in patient information
- Add medical history (allergies, conditions, medications)

### 2. **Create Triage Cases**

- Click "New Case" button
- Select existing patient
- Enter NEWS2 score (0-20)
- Set Severity Index (1-4)
- Set Resource Score (0.5-5.0)
- System automatically assigns to appropriate zone

### 3. **Manage Queues**

- **Waiting Queues**: Send patients to treatment
- **Treatment Queues**: Discharge completed patients
- **Auto-refresh**: Toggle real-time updates
- **Manual Actions**: Fill slots, auto-discharge

## Zone System

| Zone          | Color    | Criteria          | Capacity |
| ------------- | -------- | ----------------- | -------- |
| 🔴 **RED**    | Critical | NEWS2 ≥7 OR SI=4  | 5 slots  |
| 🟠 **ORANGE** | High     | NEWS2 ≥5 OR SI=3  | 8 slots  |
| 🟡 **YELLOW** | Medium   | NEWS2 ≥3 OR SI=2  | 10 slots |
| 🟢 **GREEN**  | Low      | NEWS2 <3 AND SI=1 | 15 slots |

## Priority Calculation

The system uses weighted scoring:

### Zone Weights

- **RED**: Medical severity focus (NEWS2: 40%, SI: 30%)
- **ORANGE**: Balanced approach (NEWS2: 35%, SI: 25%)
- **YELLOW**: Resource consideration (NEWS2: 25%, Resource: 30%)
- **GREEN**: Time-based fairness (Time: 30%, Resource: 20%)

### Age Factors

- **Elderly (65+)**: +1 priority boost
- **Children (≤15)**: +1 priority boost
- **Adults (16-64)**: No boost

## API Integration

The frontend integrates with these backend endpoints:

```typescript
// Patient Management
GET    /api/patients           // Get all patients
POST   /api/patients           // Create patient
GET    /api/patients/:id       // Get patient by ID

// Triage Management
POST   /api/triage/cases       // Create triage case
GET    /api/triage/queues/waiting    // Get waiting queues
GET    /api/triage/queues/treatment  // Get treatment queues
POST   /api/triage/treatment   // Send to treatment
POST   /api/triage/discharge   // Discharge patient
POST   /api/triage/treatment/fill    // Fill treatment slots
POST   /api/triage/discharge/allCompleted  // Auto-discharge
```

## Component Architecture

```
src/
├── components/
│   ├── ZoneCard.tsx           # Zone display with patient cards
│   ├── CreatePatientModal.tsx # Patient registration form
│   └── CreateCaseModal.tsx    # Triage assessment form
├── services/
│   └── api.ts                 # Backend API integration
├── types/
│   └── index.ts              # TypeScript type definitions
└── App.tsx                   # Main dashboard component
```

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon system
- **Custom Colors** - Medical-standard zone colors
- **Responsive Grid** - Adaptive layout for all screen sizes

## Error Handling

- **Network Errors** - Graceful error messages
- **Validation** - Form validation with helpful hints
- **Loading States** - Loading indicators for all actions
- **Auto-retry** - Automatic refresh on connection restore

## Performance Features

- **Auto-refresh** - Configurable real-time updates
- **Optimistic Updates** - Immediate UI feedback
- **Efficient API Calls** - Batched requests where possible
- **Responsive Design** - Smooth performance on all devices

## Development

### Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Environment Configuration

The frontend uses a proxy configuration to connect to the backend:

```json
"proxy": "http://localhost:3000"
```

This allows the frontend (port 3001) to make API calls to the backend (port 3000) without CORS issues.

## Deployment

### Production Build

```bash
npm run build
```

### Serve Static Files

```bash
npx serve -s build -l 3001
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test responsive design
4. Ensure accessibility compliance
5. Update documentation

---

**Built with ❤️ for healthcare professionals**
