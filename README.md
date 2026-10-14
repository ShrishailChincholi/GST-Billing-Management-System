# 🧾 GST POS Billing System

> A modern **Point of Sale (POS) billing application** for Indian small businesses to generate **GST Tax Invoices** and **Cash Bills** — fast, clean, and GST-compliant.

![Made in India](https://img.shields.io/badge/Made%20in-India%20🇮🇳-orange)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7%2B-green)

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Billing Logic (GST vs Cash)](#-billing-logic-gst-vs-cash)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🎯 About the Project

**GST POS Billing System** is a lightweight, self-hosted billing solution designed for:

- 🛒 Retail shops
- 🏪 Kirana / grocery stores
- 💻 Electronics stores
- 📱 Mobile shops
- 🍽️ Restaurants / cafes
- 🧵 Clothing stores
- 🛠️ Service providers

It lets you create two types of bills in seconds:

1. **Cash Bill** — Quick, thermal-printer-friendly bill for walk-in customers (no GST breakdown)
2. **GST Bill** — Full A4 tax invoice with customer GSTIN, HSN codes, and CGST/SGST/IGST breakdown

Both bills are GST-compliant, PDF-downloadable, and print-ready.

---

## ✨ Features

### 🧑‍💼 Core Features

- **Product Management** — Add/edit/delete products with name, HSN code, unit, rate, GST rate, and stock
- **Fast POS Billing** — Click products to add to cart, adjust quantity, and generate bills in one click
- **Two Bill Modes** — Cash Bill (quick sale) or GST Bill (tax invoice)
- **Auto GST Calculation** — CGST+SGST for intra-state, IGST for inter-state
- **Payment Modes** — Cash, UPI, Card, Netbanking, Credit
- **Auto Stock Deduction** — Stock is reduced on sale, restored on bill deletion
- **Sales History** — View, filter, search, print, and download past bills
- **Dashboard Analytics** — Revenue trends, bill counts, cash vs GST split, low stock alerts
- **PDF Generation** — Professional A4 GST invoice + 80mm thermal cash receipt
- **User Authentication** — JWT-based secure login with business profile (GSTIN, address, bank details)

### 🎨 UI/UX

- Modern, clean, responsive design
- Pure CSS (no Tailwind) — easy to customize
- Mobile-friendly (works on phones and tablets for billing on the go)
- Smooth animations and toast notifications
- Print-ready invoice layouts

### 🔒 Security

- bcrypt password hashing
- JWT authentication
- Input validation on both frontend and backend
- GSTIN format validation
- NoSQL injection protection via Mongoose

---

## 🛠 Tech Stack

### **Frontend**

| Tech | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Chart.js** + **react-chartjs-2** | Dashboard charts |
| **jsPDF** + **jspdf-autotable** | PDF invoice generation |
| **html2canvas** | HTML-to-image for PDF |
| **react-hot-toast** | Toast notifications |
| **lucide-react** | Icon library |
| **Pure CSS** | Styling (no Tailwind, no styled-components) |

### **Backend**

| Tech | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose 8** | ODM |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **dotenv** | Env config |
| **cors** | Cross-origin support |
| **nodemon** | Dev auto-reload |

### **Development Tools**

- **VS Code**
- **Postman** / **Thunder Client** (API testing)
- **MongoDB Compass** (DB inspection)
- **Git** + **GitHub**

---

## 📁 Project Structure
gst-pos-billing/
├── server/ # Backend (Node + Express)
│ ├── config/
│ │ └── db.js # MongoDB connection
│ ├── controllers/
│ │ ├── authController.js # Register, login, profile
│ │ ├── productController.js # Product CRUD + stock
│ │ └── saleController.js # Sale creation, listing, stats
│ ├── middleware/
│ │ ├── auth.js # JWT verification
│ │ └── errorHandler.js # Global error handler
│ ├── models/
│ │ ├── User.js # Business owner
│ │ ├── Product.js # Product catalog
│ │ └── Sale.js # Sale/bill record
│ ├── routes/
│ │ ├── authRoutes.js
│ │ ├── productRoutes.js
│ │ └── saleRoutes.js
│ ├── utils/
│ │ └── gstCalculator.js # GST math + amount-to-words
│ ├── .env # Secrets (gitignored)
│ ├── .env.example # Template
│ ├── .gitignore
│ ├── package.json
│ └── server.js # Entry point
│
├── client/ # Frontend (React)
│ ├── public/
│ │ └── index.html
│ ├── src/
│ │ ├── components/
│ │ │ ├── Billing/
│ │ │ │ ├── BillTypeSelector.jsx
│ │ │ │ ├── CustomerForm.jsx
│ │ │ │ ├── ProductPicker.jsx
│ │ │ │ ├── CartPanel.jsx
│ │ │ │ ├── BillSummary.jsx
│ │ │ │ ├── PaymentModeSelector.jsx
│ │ │ │ └── SaleSuccessModal.jsx
│ │ │ ├── Common/
│ │ │ │ └── LoadingScreen.jsx
│ │ │ └── Layout/
│ │ │ ├── Layout.jsx
│ │ │ ├── Sidebar.jsx
│ │ │ └── Header.jsx
│ │ ├── context/
│ │ │ └── AuthContext.jsx
│ │ ├── pages/
│ │ │ ├── Login.jsx
│ │ │ ├── Register.jsx
│ │ │ ├── Dashboard.jsx
│ │ │ ├── NewBill.jsx
│ │ │ ├── SalesHistory.jsx
│ │ │ ├── Products.jsx
│ │ │ ├── Settings.jsx
│ │ │ └── NotFound.jsx
│ │ ├── services/
│ │ │ └── api.js
│ │ ├── styles/
│ │ │ ├── variables.css
│ │ │ ├── global.css
│ │ │ ├── components.css
│ │ │ ├── layout.css
│ │ │ ├── auth.css
│ │ │ ├── dashboard.css
│ │ │ ├── tables.css
│ │ │ ├── billing.css
│ │ │ └── receipt.css
│ │ ├── utils/
│ │ │ ├── formatters.js
│ │ │ └── billPDF.js
│ │ ├── App.jsx
│ │ ├── index.css
│ │ └── index.js
│ ├── .env
│ ├── .env.example
│ ├── .gitignore
│ └── package.json
│
└── README.md

text

---

## 🚀 Getting Started

### **Prerequisites**

Make sure you have these installed:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **MongoDB** v7+ (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git** → [Download](https://git-scm.com/)
- A code editor like **VS Code**

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/gst-pos-billing.git
cd gst-pos-billing
2. Setup the Backend
bash
cd server

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env
# (On Windows: copy .env.example .env)

# Start the backend (dev mode with nodemon)
npm run dev
You should see:

text
✅ MongoDB Connected: localhost
📊 Database: gst_pos
🚀 Server running on port 5000
📡 API: http://localhost:5000/api
3. Setup the Frontend (in a new terminal)
bash
cd client

# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Start the React dev server
npm start
The app opens automatically at http://localhost:3000.

4. Register Your Business
Open http://localhost:3000

Click "Create one" to register

Fill in your business details:

Name, Email, Password

Business Name

GSTIN (15 chars, e.g. 27AAPFU0939F1ZV)

Address (city, state, pincode, state code)

Phone

Login and start billing!

🔐 Environment Variables
Backend (server/.env)
env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gst_pos
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
Frontend (client/.env)
env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=GST Billing
⚠️ NEVER commit .env files to Git. They're already in .gitignore.

🔌 API Endpoints
Auth — /api/auth
Method	Endpoint	Description	Auth
POST	/register	Register new business	Public
POST	/login	Login and get JWT	Public
GET	/me	Get current user	🔒 Private
PUT	/me	Update profile	🔒 Private
Products — /api/products
Method	Endpoint	Description	Auth
GET	/	List products (with search & filter)	🔒 Private
POST	/	Create product	🔒 Private
GET	/:id	Get single product	🔒 Private
PUT	/:id	Update product	🔒 Private
DELETE	/:id	Delete product	🔒 Private
PATCH	/:id/stock	Update stock	🔒 Private
Sales — /api/sales
Method	Endpoint	Description	Auth
GET	/	List sales (with filters)	🔒 Private
POST	/	Create cash/GST bill	🔒 Private
GET	/stats	Dashboard statistics	🔒 Private
GET	/:id	Get single sale	🔒 Private
DELETE	/:id	Delete sale (restores stock)	🔒 Private
Sample Request — Create GST Bill
bash
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "billType": "GST",
    "customerName": "ABC Traders",
    "customerGstin": "29AABCT1332L1Z8",
    "customerPhone": "9876543210",
    "paymentMode": "UPI",
    "items": [
      {
        "name": "LED Bulb 9W",
        "hsnCode": "9405",
        "quantity": 10,
        "unit": "PCS",
        "rate": 150,
        "discount": 0,
        "gstRate": 12
      }
    ]
  }'
Response:

json
{
  "success": true,
  "message": "Sale recorded successfully",
  "data": {
    "billNumber": "GST-202410-00001",
    "billType": "GST",
    "customerName": "ABC Traders",
    "subTotal": 1500,
    "totalCGST": 90,
    "totalSGST": 90,
    "grandTotal": 1680,
    "amountInWords": "One Thousand Six Hundred Eighty Rupees Only"
  }
}
🧮 Billing Logic (GST vs Cash)
Cash Bill
Customer-facing total = rate × quantity

No GST shown on the bill

Internally, GST is still recorded for reporting (optional)

Printed as an 80mm thermal receipt

Best for walk-in retail customers

GST Bill
Full tax invoice with CGST/SGST breakdown

Customer name & GSTIN required

Auto-detects inter-state vs intra-state based on your state code and customer's state

Intra-state → CGST + SGST (each = GST / 2)

Inter-state → IGST (full GST)

Printed as an A4 tax invoice

Best for B2B sales and customers who need input tax credit

Bill Number Format
Type	Format	Example
Cash	CB-YYYYMM-NNNNN	CB-202410-00001
GST	GST-YYYYMM-NNNNN	GST-202410-00001
Counter resets to 00001 every month.

📸 Screenshots
🔐 Login Page
Modern split-screen login with branding panel.

🧾 New Bill (POS Screen)
Two-column layout: products on left, cart on right.

📋 Sales History
Filterable table with print/PDF/delete actions.

📊 Dashboard
Revenue KPIs, 7-day trend chart, bill-type breakdown.

🖨 GST Tax Invoice (PDF)
Professional A4 invoice with blue header, item table, totals, and signature.
