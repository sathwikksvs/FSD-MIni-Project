# 👁️ CivicEye – Civic Issue Reporting & Management Platform

CivicEye connects citizens with municipal civic authorities to report, track, and resolve urban issues like potholes, garbage overflow, water leakages, streetlight failures, and public hazards.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphism & Responsive Design), Vanilla JavaScript (ES6+)
- **Interactive Visualizations**: Leaflet.js (OpenStreetMap) & Chart.js (Doughnut & Bar Analytics)
- **Backend**: Node.js & Express.js 5
- **Database**: MongoDB with Mongoose ODM (Persistent Collections)
- **File & Media Storage**: Multer for image uploads (stored locally in `/uploads` and served statically)
- **Cross-Origin**: CORS enabled

---

## 📂 Project Architecture

```
FSD2/
├── index.html            # Home page with live MongoDB counters & Category cards
├── issues.html           # Issues catalog with search, category filters, votes, status controls & photo lightbox
├── report.html           # Issue submission form with photo upload & custom category support
├── map.html              # Interactive Leaflet map with geo-pins & photo popups
├── dashboard.html        # Real-time analytics charts (Category breakdown, Status counts, Top-voted)
├── app.js                # Frontend API client and application logic
├── style.css             # Unified modern theme, animations, dark mode & components
│
└── backend/
    ├── server.js         # Express server, MongoDB connection, static serving of frontend & uploads
    ├── package.json      # Dependencies and npm scripts
    ├── .env              # Environment config (PORT, MONGO_URI, ATLAS_URI)
    ├── models/
    │   └── Issue.js      # Mongoose Issue schema (title, category, location, priority, status, imageUrl, etc.)
    ├── routes/
    │   └── issueRoutes.js# REST API router (GET, POST with Multer, GET :id, PUT, PATCH status, DELETE, VOTE)
    ├── uploads/          # Directory where user-submitted photos are safely stored
    ├── seed.js           # Database seeder with realistic civic issues & photos
    ├── verify-all.js     # End-to-end full-stack verification & diagnostic suite
    └── test-api.js       # Automated REST API unit & integration tests
```

---

## 🚀 Quick Start Guide

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Backend & Database Server
```bash
npm start
```
The server will connect to MongoDB and start listening on:
👉 **`http://localhost:5000`**

### 3. Open in Browser
Open **`http://localhost:5000`** in any browser. All pages, photos, and API requests will automatically communicate with the running server.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/issues` | Retrieves all issues sorted by newest first |
| `POST` | `/api/issues` | Submits a new issue (supports JSON or `multipart/form-data` with photo) |
| `GET` | `/api/issues/:id` | Fetches details for a specific issue |
| `PUT` | `/api/issues/:id` | Updates an existing issue |
| `PATCH`| `/api/issues/:id/status` | Updates the status (`Reported`, `In Progress`, `Resolved`) |
| `POST` | `/api/issues/:id/vote` | Increments upvote count atomically |
| `DELETE`| `/api/issues/:id` | Deletes an issue by its MongoDB ID |

---

## 🧪 Testing & Verification Scripts

From the `backend/` folder:

- **Run Full System Diagnostic**:
  ```bash
  npm run verify
  ```
  Tests direct MongoDB read/write, all REST endpoints, file uploads, and frontend page serving.

- **Run Automated REST API Tests**:
  ```bash
  npm run test-api
  ```

- **Re-Seed Sample Civic Issues**:
  ```bash
  npm run seed
  ```
