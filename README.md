# 🏙️ CityOps Issue Management System

> A web-based platform for citizens to report, track, and manage urban issues efficiently — built with AI-powered categorization and a modern dashboard UI.

**🥈 2nd Prize Winner** at the **Vibe Coding Event**, TecXell 2026 — MGM Institute of Technology, Kochi.

---

## ✨ Features

### 🧠 AI-Powered Issue Reporting
- Natural language issue description with automatic **category & priority detection**
- Supports categories: Road & Transport, Public Utilities, Sanitation & Waste, Electric & Lighting
- Smart keyword-based analysis engine that simulates AI behaviour

### 📊 Real-Time Dashboard
- Live statistics — Total, Pending, and Resolved issue counts
- Filter issues by status (All / Pending / Resolved)
- Full-text search across issue titles and descriptions
- City heatmap visualization

### 🛠️ Admin Panel
- Tabular view of all reported issues with inline actions
- Resolve or delete issues directly from the table
- Search and filter controls with resolution rate tracking

### 📈 Analytics
- Category distribution bar chart
- Priority breakdown visualization (Critical / High / Medium / Low)
- Dynamic, data-driven charts rendered in real time

### 📋 Issue Details Page
- Detailed view for each issue with photo evidence, coordinates, and full description
- One-click resolve and delete actions

### 🔐 Authentication
- Login and Registration pages with role-based redirection (Admin / User)
- Persistent session via `localStorage`

### 📸 Image Upload
- Attach photo evidence when reporting issues
- Base64 image preview before submission

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| **Frontend** | HTML, TailwindCSS (CDN), Vanilla JS |
| **Backend**  | Node.js, Express.js                |
| **Data**     | JSON file-based storage            |
| **Fonts**    | Google Fonts (Public Sans, Inter)  |
| **Icons**    | Material Symbols Outlined          |

---

## 📂 Project Structure

```
smart-city-issue-management/
├── client/
│   ├── index.html          # Main citizen dashboard
│   ├── admin.html          # Admin management panel
│   ├── analytics.html      # Analytics & charts page
│   ├── details.html        # Individual issue detail view
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── script.js           # All frontend logic (API calls, rendering, interactivity)
│   └── style.css           # Custom styles
├── server/
│   └── server.js           # Express.js backend (API routes, mock AI, auth)
├── data/
│   └── issues.json         # JSON data store for issues
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/JiphinGeorge/smart-city-issue-management.git
cd smart-city-issue-management

# Install dependencies
npm install

# Start the server
node server/server.js
```

The app will be running at **http://localhost:3000**

### Demo Credentials

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@cityops.com    | admin123  |
| User  | user@cityops.com     | user123   |

> Any other email/password combination will also log in as a regular user (prototype behaviour).

---

## 📡 API Endpoints

| Method   | Endpoint           | Description                        |
|----------|--------------------|------------------------------------|
| `GET`    | `/api/issues`      | Fetch all issues                   |
| `POST`   | `/api/issues`      | Create a new issue                 |
| `PUT`    | `/api/issues/:id`  | Update an issue (e.g., resolve)    |
| `DELETE` | `/api/issues/:id`  | Delete an issue                    |
| `POST`   | `/api/analyze`     | AI-based category & priority suggestion |
| `POST`   | `/api/login`       | User authentication                |
| `POST`   | `/api/register`    | User registration                  |

---

## 👥 Team

- **Jiphin George** — [GitHub](https://github.com/JiphinGeorge)
- **Umesh**

---

## 🏆 Acknowledgements

Built during the **Vibe Coding Event** at **TecXell 2026**, Muthoot  Institute of Technology, Kochi.
A big thank you to the organizers and volunteers for hosting such an amazing event! 👏

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
