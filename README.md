# MedSync AI Platform

MedSync AI is a smart hospital resource synchronization and emergency command center dashboard built to coordinate ambulances, equipment, beds, and personnel dynamically.

> [!IMPORTANT]
> ### 🔑 Quick Access Demo Credentials
> The frontend login is pre-filled for convenience, but you can log in with **any email and password** (mock authentication). For standard roles, use:
> - **Super Admin**: `admin@medsync.com` / `admin123`

## 🛠️ Technology Stack
- **Backend**: FastAPI (Python), SQLAlchemy ORM, SQLite Database, Alembic Migrations, Pydantic.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Radix UI/Shadcn Components.
- **Authentication**: JWT (JSON Web Tokens) via FastAPI's OAuth2 Password Flow.

---

## 🔄 Project Architecture & Operational Flow

The MedSync AI platform coordinates emergency patient triaging and hospital resource assignment through a multi-agent orchestration workflow built on **LangGraph**. Below is the sequence of operations:

```mermaid
graph TD
    A[User Sign In / Dashboard Guard] --> B[Emergency Command Center]
    B -->|Selects/Registers Emergency Patient| C[Trigger LangGraph API]
    
    subgraph LangGraph Multi-Agent Engine
        C --> D[Patient Agent: Analyze Symptoms & Reqs]
        D --> E[Priority Agent: Calculate Severity Score]
        E --> F[Doctor Agent: Rank Available Doctors]
        F --> G[Nurse Agent: Rank Available Nurses]
        G --> H[ICU Agent: Match ICU Bed]
        H --> I[OR Agent: Match Operating Room]
        I --> J[Equipment Agent: Assign physical assets]
        J --> K{Negotiation Agent: Resolve Conflicts}
        K -->|Conflict: Bed Blocked| H
        K -->|Conflict Resolved| L[Explainability Agent: Clinical Rationale]
        L --> M[Assignment Agent: SQLite DB Commit]
    end
    
    M --> N[Real-time Vis: Network Graph & Logs]
```

### Flow Breakdown

1. **User Ingress**:
   - The user visits the application. The frontend route guard checks local credentials and redirects to `/login` if unauthenticated.
   - Once authenticated, the user is presented with the **Emergency Command Center** (the hub) and other resource management views.

2. **Emergency Dispatches**:
   - When a dispatcher selects an emergency patient in the **Emergency Command Center**, the frontend calls the backend's `/api/v1/workflow/process` endpoint.

3. **LangGraph Pipeline**:
   - **Triage Assessment (Patient Agent)**: Scans the patient record and parses symptoms/history to list resource needs (such as doctors, ICU beds, oxygen, surgical prep).
   - **Severity Scoring (Priority Agent)**: Calculates a deterministic emergency priority score (Critical, High, Medium, Low).
   - **Resource Matching (Doctor & Nurse Agents)**: Ranks qualified doctors and nurses based on specialization, schedule, and live availability.
   - **Infrastructure Allocation (ICU Bed & OR Agents)**: Filters and targets free ICU beds and Operating Rooms.
   - **Physical Inventory Check (Equipment Agent)**: Targets specific machinery like ventilators and cardiac monitors.
   - **Conflict Negotiation (Negotiation Agent)**: Audits the selection. *Simulation Feature*: If a resource combination is unavailable (e.g. top ICU bed undergoes unexpected maintenance), it rejects the combination and loops back to reallocate the next best option.
   - **Clinical Rationale (Explainability Agent)**: Automatically constructs an explanatory clinical writeup with confidence metrics.
   - **Persistence (Assignment Agent)**: Safely locks the resources in SQLite database, updates the patient status to "Admitted", and terminates the graph.

4. **Dispatcher Visualization**:
   - The frontend consumes the LangGraph execution logs and dynamically animates the active agent node in the live network graph canvas (rendered via `@xyflow/react`).

---

## 🚀 Quick Start Guide

The easiest way to start both the backend and frontend servers is by running the helper script at the root:

```bash
# Run the startup batch script (Windows)
.\run.bat
```

This script will:
1. Launch the FastAPI server at `http://localhost:8000`.
2. Launch the Vite React client at `http://localhost:5173`.
3. Open `http://localhost:5173/` in your default browser.

---

## 🔑 Default Credentials

The database is seeded with two admin accounts for testing and platform administration:

| Role | Username (Email) | Password |
|---|---|---|
| **Super Admin** | `admin@medsync.com` | `admin123` |
| **Hospital Admin** | `hadmin@medsync.com` | `hadmin123` |

*Note: The login form is prefilled with the Super Admin credentials by default during development for ease of use.*

---

## 🔒 Authentication & Login Workflow

The platform has been configured with a client-side mock/dummy authentication flow for ease of previewing and testing:

### 1. User Login Request (Frontend)
- The user enters any email and password on the Login Page ([Login.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/pages/Login.tsx)).
- Default credentials are prefilled (`admin@medsync.com` / `admin123`), but any text is accepted.
- Clicking "Sign In" calls the `handleLogin` function.

### 2. Mock Token Generation (Frontend)
- Instead of hitting the backend database, the frontend simulates a brief authorization delay (500ms).
- A dummy access token (`dummy-token-12345`) and user profile (with the role `super_admin`) are generated locally.

### 3. Session Persistence (Frontend)
- The dummy token and user profile are written to the browser's `localStorage` via the [AuthContext.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/context/AuthContext.tsx).
- The client navigates automatically to the `/dashboard`.

### 4. Client-Side Route Protection (Frontend)
- All protected layouts and dashboard elements are inside the `DashboardLayout` route wrapper in [App.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/App.tsx).
- When any route under `/` is visited, [DashboardLayout.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/layouts/DashboardLayout.tsx) checks the authentication state:
  - If no token is found in `localStorage`, the user is immediately redirected back to `/login`.
- If authenticated, the user profile determines role-specific content (e.g., hiding or showing hospital management lists based on `user.role === 'super_admin'`).

### 5. User Logout Flow
- When the user clicks **Logout** in the sidebar:
  1. The `logout()` function from `AuthContext` is called.
  2. The dummy token and user profile are deleted from `localStorage`.
  3. The client redirects back to `/login`.


---

## 📁 Key Authentication Source Code Files
- **Frontend Context**: [AuthContext.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/context/AuthContext.tsx) — Manages global login states and headers.
- **Frontend Page**: [Login.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/pages/Login.tsx) — Collects user input and initiates authentications.
- **Frontend Layout**: [DashboardLayout.tsx](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/frontend/src/layouts/DashboardLayout.tsx) — Handles route guarding/protection and layout rendering.
- **Backend Endpoint**: [auth.py](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/backend/app/api/v1/auth.py) — Validates passwords and issues JSON Web Tokens.
- **Backend Cryptography**: [security.py](file:///c:/medsync/medsync-ai%20%281%29/medsync-ai/backend/app/core/security.py) — Contains password hashing and JWT encoding/decoding utilities.
