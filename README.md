# 🚗 Cloud-Based Smart Parking Management System

A full-stack, cloud-native **Smart Parking Management System** engineered for university campuses, commercial complexes, and urban transit hubs. Built with **React 19, Vite, Node.js, Express.js, MongoDB Atlas (Mongoose ODM), JWT Authentication with bcrypt, and Chart.js**.

---

## 🌟 Key Highlights & Features

- **Multi-Level Deck Visualizer:** Spatial 2D visualizer showing real-time slot status across Ground Floor, Floor 1, Floor 2, and Basement decks.
- **Dynamic Pricing Engine:** Calculates hourly parking rates dynamically based on vehicle category (Four-Wheeler, Two-Wheeler, EV) and scheduled duration.
- **EV Fast Charging Bays:** Dedicated spots with EV charging tags and dedicated rate structures.
- **Contactless Digital Gate Passes:** Generates printable digital parking tickets with ticket reference numbers and simulated barrier gate QR codes.
- **Role-Based Access Control (RBAC):** Distinct interfaces, capabilities, and backend protections for Drivers/Students and Facility Administrators.
- **Admin Command & Chart.js Telemetry:** Interactive graphs for occupancy breakdown (Doughnut), vehicle capacity distribution (Bar), and daily/monthly booking volume & revenue trends (Bar/Line combo).
- **CRUD Operations for Bays & Bookings:** Full lifecycle slot inventory management and gate transaction transitions (*Confirmed* ➔ *Active* ➔ *Completed* / *Cancelled*).
- **Embedded Zero-Config Demo Mode:** Automatically runs with an embedded in-memory database and seeded demo records if local MongoDB daemon or Atlas is not yet configured, ensuring college presentations run reliably out-of-the-box.
- **Single-Origin Production Run:** Option to serve the compiled React SPA directly from Express on a single port (`http://localhost:5000`) or run Vite dev server (`http://localhost:5173`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 19, Vite, React Router v7, Lucide Icons |
| **Styling** | Vanilla CSS (CSS Design Tokens, Glassmorphism, Dark Tech Theme) |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud) / Local MongoDB / Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs password hashing |
| **Telemetry & Graphs** | Chart.js & React-Chartjs-2 |

---

## 🏛️ System Architecture

```mermaid
graph TD
    User["Customer / Driver (Browser)"]
    Admin["Facility Admin (Browser)"]
    
    subgraph Frontend["React 19 + Vite Frontend"]
        UI_User["User Dashboard & Booking Flow"]
        UI_Admin["Admin Central Command & Telemetry"]
        API_Client["API Service Layer (Fetch + JWT Interceptor)"]
    end

    subgraph Backend["Express.js Server (Port: 5000)"]
        HealthRoute["GET /api/health (Connection Diagnostic)"]
        AuthRoute["POST /api/auth (Login, Register, Profile)"]
        SlotRoute["CRUD /api/slots (Spatial Inventory)"]
        BookingRoute["CRUD /api/bookings (Gate Lifecycle)"]
        StaticServer["Static File Middleware (frontend/dist)"]
    end

    subgraph Database["MongoDB Database"]
        AtlasDB[("MongoDB Atlas Cloud / Local / Embedded")]
    end

    User -->|Vite :5173 or Express :5000| UI_User
    Admin -->|Vite :5173 or Express :5000| UI_Admin
    UI_User --> API_Client
    UI_Admin --> API_Client
    API_Client -->|REST API with Bearer JWT| Backend
    Backend -->|Mongoose Queries| AtlasDB
```

---

## ☁️ Step-by-Step MongoDB Atlas Setup Guide

Follow these steps to connect the system to a free cloud-hosted MongoDB Atlas database:

### 1. Create a MongoDB Atlas Account
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Select **M0 Free Shared Cluster** (Free tier forever, no credit card required).
3. Choose your closest cloud provider and region (e.g., AWS / Mumbai or Singapore).
4. Name your cluster (e.g., `Cluster0`) and click **Create Deployment**.

### 2. Configure Database User Credentials
1. In the **Security** tab on the left sidebar, click **Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Set a username (e.g., `parking_admin`) and a secure password (e.g., `ParkingAtlas2026!`).
5. Built-in Role: **Read and write to any database**.
6. Click **Add User**.

### 3. Configure IP Access List (Network Access)
1. In the **Security** tab, click **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) or click **Add Current IP Address**.
4. Click **Confirm** (status will show *Active* within 1-2 minutes).

### 4. Copy Your Connection String
1. Go to the **Clusters / Database** tab.
2. Click the **Connect** button next to your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection URI string. It will look like:
   ```text
   mongodb+srv://parking_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. Replace `<password>` with your database user password and specify the database name:
   ```text
   mongodb+srv://parking_admin:ParkingAtlas2026!@cluster0.abcde.mongodb.net/smart_parking_db?retryWrites=true&w=majority
   ```

---

## ⚙️ Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env`:

```bash
# Windows PowerShell
copy backend\.env.example backend\.env

# Linux / macOS
cp backend/.env.example backend/.env
```

### `backend/.env` Parameter Reference

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGODB_URI` | Connection URI for MongoDB Atlas or local MongoDB | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/smart_parking_db` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens | Strong random string (e.g. `smart_parking_jwt_super_secret_key_2026`) |
| `ADMIN_SECRET_KEY`| Passkey required to register an Admin account via the web UI | `admin123` |
| `CLIENT_URL` | Allowed frontend origins for CORS (comma-separated) | `http://localhost:5173` |

> [!NOTE]
> `backend/.env.example` contains placeholder values only. Never commit your production `.env` file with actual passwords to public Git repositories.

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v22+ installed)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Step 1: Install Dependencies
Run the install command from the root directory to install dependencies for both backend and frontend:

```bash
npm run install:all
```

Or install individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 💻 Running the Application

You can run the application in two ways:

### Option A: Development Mode (Recommended for Development)
Runs the backend API on port 5000 and the Vite frontend on port 5173 with hot reloading:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Start Frontend Client (Port 5173)
npm run dev:frontend
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

### Option B: Single-Origin Production Mode (Best for College Presentations)
Compiles the React frontend into static assets and serves both the frontend SPA and the REST API from Express on a single port (`5000`):

```bash
# 1. Build the React frontend
npm run build

# 2. Start the unified server
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 🩺 System Health Diagnostic Endpoint

The backend includes a health check endpoint:

```http
GET http://localhost:5000/api/health
```

### Sample Response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "Cloud-Based Smart Parking Management System API",
  "uptimeSeconds": 142,
  "timestamp": "2026-10-26T17:18:30.282Z",
  "environment": "development",
  "backend": {
    "status": "online",
    "nodeVersion": "v24.19.0",
    "port": 5000
  },
  "database": {
    "status": "connected",
    "connected": true,
    "type": "MongoDB Atlas (Cloud)",
    "name": "smart_parking_db"
  },
  "features": {
    "singleOriginStaticServing": true,
    "viteDevSupport": true
  }
}
```

> [!IMPORTANT]
> The `/api/health` endpoint verifies the live database connection and reports server status **without exposing secrets**, passwords, or internal connection strings.

---

## 📦 Database Seeding & Admin Provisioning

### 1. Safe Database Seeding Script (`seedData.js`)
Populate sample parking bays across Ground Floor, Floor 1, Floor 2, and Basement 1, plus sample demo users and booking transactions:

```bash
# Safe mode: checks if slots already exist and prevents accidental data loss
npm run seed

# Force mode: clears existing records and reseeds fresh demo data
npm run seed -- --force
```

### 2. Creating the Initial Administrator Account Securely

There are two secure ways to create the initial administrator:

#### Method 1: Using the Provisioning Script (Recommended)
Run the dedicated provisioning script from your terminal:

```bash
cd backend
node scripts/createAdmin.js [email] [password] [name]

# Example:
node scripts/createAdmin.js admin@parking.com SecureAdmin2026! "Facility Director"
```
Or use the npm script shortcut:
```bash
npm run create-admin
```
This script:
- Derives credentials securely.
- Hashes passwords using bcrypt with 10 salt rounds.
- Elevates an existing user or creates a new administrator.
- Never prints plain-text passwords to logs.

#### Method 2: Web Registration with `ADMIN_SECRET_KEY`
1. Navigate to the **Register** page on the frontend.
2. Select the **Facility Administrator** tab.
3. Enter your details and input the `ADMIN_SECRET_KEY` configured in `backend/.env` (default: `admin123`).
4. Without the matching secret key, registration defaults strictly to a standard customer account (enforced on the backend with HTTP 403).

---

## 🔑 Default Demo Credentials for Presentations

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Facility Administrator** | `admin@parking.com` | `admin123` | Full Admin Dashboard, Slot Management, Gate Controls |
| **Student / Driver** | `user@parking.com` | `user123` | Slot Availability, Booking, My Bookings, Passes |

> [!TIP]
> The Login page features **"Demo User"** and **"Demo Admin"** 1-click autofill buttons for effortless live college viva demonstrations!

---

## 🌐 Complete REST API Reference

### Health & Diagnostic
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Reports backend uptime & database connection status |

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer or admin (requires secret key) |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Private | Get profile of logged-in user |
| `PUT` | `/api/auth/profile` | Private | Update user vehicle plate & contact info |

### Parking Slots Inventory (`/api/slots`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/slots` | Public | Retrieve slots with floor & vehicle filters |
| `GET` | `/api/slots/:id` | Public | Retrieve single slot details |
| `POST` | `/api/slots` | Admin | Create a new parking bay |
| `PUT` | `/api/slots/:id` | Admin | Update slot details (floor, rate, amenities) |
| `PUT` | `/api/slots/:id/disable` | Admin | Toggle bay maintenance / available status |
| `DELETE` | `/api/slots/:id` | Admin | Delete an unoccupied parking slot |

### Bookings & Gate Access (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Private | Create a parking reservation with conflict lock |
| `GET` | `/api/bookings/my-bookings`| Private | View logged-in customer's booking history |
| `GET` | `/api/bookings/admin/stats`| Admin | Real-time telemetry, KPIs & Chart.js statistics |
| `GET` | `/api/bookings` | Admin | View all bookings with date, slot & status filters |
| `GET` | `/api/bookings/:id` | Private | View single booking details |
| `PUT` | `/api/bookings/:id/cancel` | Private | Cancel reservation & issue refund |
| `PUT` | `/api/bookings/:id/status` | Admin | Gate transitions (Pending -> Confirmed -> Active -> Completed) |

---

## 🔧 Comprehensive Troubleshooting Guide

### 1. MongoDB Connection Error (`connect ECONNREFUSED 127.0.0.1:27017`)
- **Cause:** Local MongoDB service is not running and no MongoDB Atlas connection string is configured.
- **Solution:**
  1. **Recommended:** Create a free MongoDB Atlas cluster and set `MONGODB_URI` in `backend/.env`.
  2. Or start your local MongoDB daemon: `mongod --dbpath <data_path>`.
  3. **Zero-Config Fallback:** If you run `node server.js`, the backend automatically starts an in-memory database and pre-seeds it so your presentation works immediately even without an internet connection!

### 2. MongoDB Atlas Timeout (`MongooseServerSelectionError: connection timed out`)
- **Cause:** Your current IP address is not whitelisted in MongoDB Atlas.
- **Solution:**
  1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
  2. Navigate to **Security** ➔ **Network Access**.
  3. Click **Add IP Address** ➔ **Allow Access from Anywhere** (`0.0.0.0/0`).
  4. Save and retry after 60 seconds.

### 3. Port Conflict (`Error: listen EADDRINUSE: address already in use :::5000`)
- **Cause:** Another process is running on port 5000.
- **Solution:**
  - On Windows PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
    ```
  - Or change `PORT=5001` in `backend/.env` and update `VITE_API_BASE_URL` in `frontend/.env`.

### 4. CORS Error in Browser Console (`Access-Control-Allow-Origin`)
- **Cause:** Frontend origin does not match the allowed origins in `backend/server.js`.
- **Solution:**
  - Verify that `CLIENT_URL=http://localhost:5173` is set in `backend/.env`.
  - For single-origin runs on port 5000, CORS is bypassed entirely because requests are same-origin.

### 5. Single-Origin Mode Shows 404 for Frontend Assets
- **Cause:** `frontend/dist` has not been compiled yet.
- **Solution:**
  - Run `npm run build` from the root directory to generate the production bundle.

---

## 📜 Academic Viva Questions & Answers

1. **How does the system prevent double bookings during simultaneous requests?**
   - The booking controller uses atomic MongoDB updates with condition locks on `activeReservations` overlapping time intervals. If two users attempt to reserve the same bay for the same time window, the database rejects the second update and returns HTTP 409 Conflict.
2. **How does role-based access control (RBAC) work?**
   - User identity and role (`customer` vs `admin`) are encoded into a signed JSON Web Token (JWT). The backend `protect` middleware verifies the token signature with `JWT_SECRET`, and the `authorize('admin')` middleware blocks unauthorized users at the route level with HTTP 403 Forbidden.
3. **What is the difference between Scheduled Reservations and Current Occupancy?**
   - A slot is marked as *Reserved* for future booking windows. It is marked as *Occupied* only when the vehicle is checked in at the gate (`Active` status) or when current clock time falls within the active reservation window (`startTime <= now <= endTime`).
4. **How are passwords stored securely?**
   - Passwords are salt-hashed using `bcryptjs` with 10 salt rounds before being written to MongoDB. Plain-text passwords are never stored or returned in API responses.
