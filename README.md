# Insta Prints — Professional Service-Ordering & Fulfillment Platform

Full-stack service platform built around a single central entity — the **Request ID** — connecting a user's information, requirements, files, quotation, chat, payments, and status history into one unified record.

---

## 🌟 Key Architecture & Features

### 1. User Portal (No Login/Signup Required)
- **Order Placement Form:** Client details, branch (`AIML`, `R&AI`, `IOT`), service category, technical requirements, deadline selector, specific formatting instructions, and multi-file attachments (PDF, DWG, DXF, DOCX, PPTX, Images, ZIP).
- **Central Request ID:** Generated on submission (e.g. `IP-2026-XXXXX`). Serves as the single access key.
- **Request Tracking & Client Hub:** Verified via **Request ID + Registered Mobile Number**.
  - 11-step visual order progression stepper.
  - Quotation acceptance & advance payment calculation (minimum 50%).
  - Deliverable repository with authenticated file download streams.
  - Request-scoped private real-time chat with the studio.
  - Printable official tax invoice & receipt generator.

### 2. Admin Portal (Strictly Locked Single Admin)
- **Single Fixed Admin Account:** Strictly locked to `instaprints@gmail.com` with bcrypt-12 password hashing. No public registration endpoint exists anywhere in the codebase.
- **Rate-Limited Login:** Protects against brute-force attacks (5 attempts / 15 mins).
- **JWT Authentication:** Short-lived tokens for secure administrative session management.
- **Management Console:**
  - Real-time KPI metrics (Total Requests, New, Pending Payments, In Production, Completed, Total Revenue).
  - Search, filter by branch/service/status, and sort by deadline/date.
  - Quotation manager with dynamic advance percentage calculation (50% to 100%).
  - Workflow status transition controller with audit logs.
  - Work proofs & final deliverables uploader.
  - Manual payment recorder & UTR transaction verifier.
  - Direct private chat with the client scoped to Request ID.
  - Export orders to CSV/Excel for business accounting.
  - Security audit log drawer for suspicious/failed login attempts.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios
- **Backend:** Node.js, Express, Helmet, CORS, Multer, Bcrypt.js, JSONWebToken, Express Rate Limit
- **Database:** MongoDB / Mongoose with instant zero-friction datastore fallback

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Ramhemanth09/insta-prints.git
cd insta-prints

# Install server dependencies
cd server
npm install
npm run seed   # Seeds the fixed admin account

# Install client dependencies
cd ../client
npm install
```

### 2. Start Development Servers
```bash
# Terminal 1: Start Backend Server (Port 5000)
cd server
npm start

# Terminal 2: Start Frontend Client (Port 5173)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔐 Administrative Account

- **Email:** `instaprints@gmail.com`
- **Password:** `Instaprints@2026`
- **Algorithm:** Bcrypt with cost factor 12

---

## 📦 Production Deployment

### Frontend (Vercel / Netlify / Hostinger)
- **Root directory:** `client`
- **Build command:** `npm run build`
- **Output directory:** `dist`

### Backend (Render / Railway / VPS / AWS EC2)
- **Root directory:** `server`
- **Start command:** `npm start`
- **Environment variables:** `PORT=5000`, `JWT_SECRET`, `CLIENT_ORIGIN`
