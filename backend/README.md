# Cloud-Based Smart Parking Management System — Backend API

A production-ready RESTful backend built with **Node.js**, **Express.js**, and **Mongoose** connecting to **MongoDB Atlas**. Designed with security, modularity, role-based access control (RBAC), and clean architecture.

---

## 🛠️ Tech Stack & Key Libraries

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Database & ODM:** MongoDB Atlas / Local MongoDB via Mongoose 8.x
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password Security:** `bcryptjs` (salt rounds: 10, pre-save hashing hook)
- **CORS & Environment:** `cors`, `dotenv`

---

## 📋 Environment Configuration (`.env`)

Create a `.env` file in the `backend/` directory (or copy from `.env.example`):

```env
# Server Port
PORT=5000

# MongoDB Atlas Connection String
# Example: mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/smart_parking_db?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/smart_parking_db?retryWrites=true&w=majority

# JWT Signing Secret (Never expose publicly)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Secret Passkey required to register an Admin account
ADMIN_SECRET_KEY=admin123

# Frontend Application Origin (for CORS)
CLIENT_URL=http://localhost:5173
```

> [!NOTE]
> For local development without Atlas, you can use:
> `MONGODB_URI=mongodb://127.0.0.1:27017/smart_parking_db`

---

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Provision Initial Admin Account:**
   ```bash
   npm run create-admin
   # Or with custom credentials:
   node scripts/createAdmin.js admin@parking.com MySecurePassword123! "Head Admin"
   ```

3. **(Optional) Seed Demo Parking Slots & Data:**
   ```bash
   npm run seed
   ```

4. **Start Backend Server:**
   ```bash
   # Development mode with auto-reload:
   npm run dev

   # Production mode:
   npm start
   ```

The server starts at `http://localhost:5000`. Test the health check endpoint:
```bash
curl http://localhost:5000/
```

---

## 🔐 Security & Role-Based Authorization Model

### 1. Two-Tier Role System
- **`customer` (or `user`):** Standard campus motorists. Can view parking slot availability, create parking bookings, view their own bookings, and cancel eligible upcoming bookings.
- **`admin`:** Facility management staff. Can add, edit, disable/enable, and delete parking slots, view all customer bookings across the system, update booking statuses, and view occupancy & revenue analytics.

### 2. Identity Derivation from Verified JWT
- **Zero ID Spoofing:** User identity is strictly derived from the decoded JWT claims (`req.user._id`) inside the `protect` middleware.
- APIs completely ignore any client-supplied `userId` or `role` in the request body.

### 3. Protection Against Cross-User Tampering
- When retrieving or cancelling a booking (`GET /api/bookings/:id`, `PUT /api/bookings/:id/cancel`), the backend strictly verifies that `booking.user.toString() === req.user._id.toString()`.
- Unauthorized requests attempting to access or modify another customer's booking are rejected with `403 Forbidden`.

### 4. Zero Plaintext Passwords & Safe Serialization
- Passwords are salted and hashed using `bcryptjs` in a Mongoose `pre('save')` hook.
- The `User` model overrides `toJSON()` to automatically strip the `password` field from all JSON API responses.

### 5. Secure Initial Admin Provisioning
- Standard public registration (`POST /api/auth/register`) **strictly defaults to the `customer` role**.
- Users **cannot** elevate themselves to `admin` simply by sending `role: "admin"`. If `role === 'admin'` is passed, the request must include the matching `adminSecretKey` defined in the server's `.env`.
- Alternatively, administrators can be provisioned securely via the command line with `npm run create-admin`.

---

## 📡 REST API Reference

### 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register new customer (or admin if `adminSecretKey` matches). Status: `201 Created` |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password, returns JWT token. Status: `200 OK` |
| `GET`  | `/api/auth/me` | Private | Get profile of currently logged-in user (from JWT). Status: `200 OK` |
| `PUT`  | `/api/auth/profile` | Private | Update name, phone, or vehicle registration. Status: `200 OK` |

#### Sample Register Request:
```json
{
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "password": "Password123!",
  "phone": "+91 98765 12345",
  "vehicleNumber": "MH-12-PQ-4567",
  "vehicleType": "Four-Wheeler"
}
```

---

### 2. Parking Slot Routes (`/api/slots`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/slots` | Public | Get all parking slots. Supports `?floor=`, `?vehicleType=`, `?status=`. Status: `200 OK` |
| `GET`    | `/api/slots/:id` | Public | Get details of a single parking bay. Status: `200 OK` / `404` |
| `POST`   | `/api/slots` | Admin | Create a new parking bay (`slotNumber`, `floor`, `hourlyRate`, etc.). Status: `201 Created` |
| `PUT`    | `/api/slots/:id` | Admin | Update slot details or status. Status: `200 OK` |
| `PUT`    | `/api/slots/:id/disable` | Admin | Toggle slot between `maintenance` (disabled) and `available`. Status: `200 OK` |
| `DELETE` | `/api/slots/:id` | Admin | Delete a parking slot (prevented if occupied). Status: `200 OK` |

#### Sample Create Slot Request (Admin):
```json
{
  "slotNumber": "G-08",
  "floor": "Ground Floor",
  "vehicleType": "EV",
  "hourlyRate": 80,
  "isCovered": true,
  "hasCharging": true,
  "status": "available"
}
```

---

### 3. Booking Routes (`/api/bookings`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`  | `/api/bookings/check-availability` | Public | Verify if a bay is free for a date & time window (`?slotId=&startTime=&endTime=`). Status: `200 OK` |
| `POST` | `/api/bookings` | Customer | Reserve an available parking slot (atomic concurrency lock & overlap rejection). Status: `201 Created` / `409 Conflict` |
| `GET`  | `/api/bookings/my-bookings` | Customer | Get booking history of the authenticated customer. Status: `200 OK` |
| `GET`  | `/api/bookings/:id` | Customer / Admin | Get single booking details (ownership enforced). Status: `200 OK` / `403` / `404` |
| `PUT`  | `/api/bookings/:id/cancel` | Customer / Admin | Cancel an eligible booking (Pending/Confirmed) and release slot. Status: `200 OK` |
| `GET`  | `/api/bookings` | Admin | List all bookings across the campus (supports `?status=` and `?search=`). Status: `200 OK` |
| `PUT`  | `/api/bookings/:id/status` | Admin | Update booking lifecycle (`Pending`, `Confirmed`, `Active`, `Completed`, `Cancelled`). Status: `200 OK` |
| `GET`  | `/api/bookings/admin/stats` | Admin | Get aggregated statistics (total bays, revenue, dynamic occupancy). Status: `200 OK` |

#### Sample Create Booking Request:
```json
{
  "slotId": "65dd4b1234567890abcdef12",
  "vehicleNumber": "MH-12-PQ-4567",
  "vehicleType": "Four-Wheeler",
  "startTime": "2026-10-27T10:00:00.000Z",
  "endTime": "2026-10-27T13:00:00.000Z",
  "durationHours": 3,
  "paymentMethod": "UPI"
}
```

---

## ⚡ Concurrency & Dynamic Occupancy Engine

- **Overlap Prevention (HTTP 409):** The backend queries for existing bookings where `startTime < requestedEndTime && endTime > requestedStartTime` for active reservation states (`Pending`, `Confirmed`, `Active`).
- **Atomic Concurrency Protection:** Simultaneous booking requests are serialized using MongoDB's atomic document update (`findOneAndUpdate`) with `$not: { $elemMatch: { ... } }` over `ParkingSlot.activeReservations`. Exactly one concurrent request succeeds while competing requests receive a clean `409 Conflict`.
- **Scheduled vs. Current Occupancy:** A bay with a reservation scheduled for tomorrow is not falsely shown as occupied today. Live status is evaluated dynamically: `occupied` during active sessions, `reserved` for reservations starting within 30 minutes, and `available` with an "Upcoming Reservation" tag otherwise.
- **Sensor Disclaimer:** Occupancy and availability in this system are computed in real time from stored system bookings and verified gate passes (software-managed, no physical IoT hardware sensors required).

---

## 🧪 Error Handling & HTTP Status Codes

The API uses standardized HTTP status codes across all endpoints:

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (missing fields, start >= end, past start date, slot in maintenance).
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: Access denied due to role mismatch or attempting to access another user's booking.
- `404 Not Found`: Requested slot, booking, or user does not exist.
- `409 Conflict`: Slot is already booked for an overlapping time window or locked by a concurrent request.
- `500 Internal Server Error`: Unhandled database or server exception.
