# SuperMart - Supermarket POS & Inventory Management System

A high-fidelity frontend client demo for **SuperMart**, an intelligent supermarket billing and inventory management application designed with a modern glassmorphic aesthetic. Built entirely with clean vanilla **HTML5, CSS3, and JavaScript**, persisting state directly in `localStorage` with zero backend dependencies. Fully structured for effortless future conversion into Laravel Blade templates, controllers, and REST APIs.

---

## 🚀 How to Open the Demo

1. **Directly in Browser**: Double-click `index.html` in your file explorer to open it in Google Chrome, Microsoft Edge, Firefox, or Safari.
2. **Via Local Server (Optional)**:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node
   npx serve
   ```
   Then open `http://localhost:8000/` in your browser.

---

## 🔐 Demo Login Credentials

Login has Cashier and Admin tabs with role validation. Passwords are stored only as salted SHA-256 hashes in `js/auth.js` (not plain text). The 1-click demo box is shown only on `localhost`, `127.0.0.1` or `file://`.

| Role | Username | Password | Default Redirect | Accessible Features |
| :--- | :--- | :--- | :--- | :--- |
| **Cashier** | `cashier` | `12345678` | `pos.html` | POS Billing, Barcode Scanning, Live Cart, Thermal Receipts, Held Bills |
| **Admin** | `admin` | `12345678` | `admin.html` | Full IMS Dashboard, Analytics, Products CRUD, Stock In, Reports, Settings |

> **Demo only.** `12345678` is a weak password. Change it before sharing this publicly: open the login page console and run `Auth.hash('admin', 'new-password').then(console.log)`, then paste the result into `passwordHash` in `js/auth.js`.
> This is a frontend-only demo, so it can be bypassed from the browser. Real security comes with the Laravel backend.

---

## 📁 File Structure

```
├── index.html              # SuperMart Login screen with role switcher & 3D art
├── pos.html                # Cashier Point-of-Sale (POS) terminal screen
├── admin.html              # Admin Inventory & Analytics dashboard
├── css/
│   ├── login-fixes.css     # Login page fixes (loaded after style.css)
│   ├── mobile.css          # Mobile & tablet layout (bottom nav, stacked panels)
│   └── style.css           # Glassmorphic neumorphic design system & 80mm print CSS
├── js/
│   ├── data.js             # LocalStorage fake database seed (20 products, bills, suppliers)
│   ├── auth.js             # Session management, route guards, Web Audio SFX & live clock
│   ├── pos.js              # POS cashier billing logic, scanning, thermal receipt & shift stats
│   └── admin.js            # Admin dashboard, Chart.js graphs, CRUD, inventory & CSV export
└── assets/
    └── images/             # 3D illustration assets and mockups
```

---

## ✨ Key Features Implemented

### 1. Cashier POS (`pos.html`)
- **Auto-Focused Barcode Scanning**: Scan with physical USB/Bluetooth scanner or type barcodes (e.g. `100001`, `100002`) + press `Enter`.
- **Web Audio Sound Effects**: Realistic POS scanner audio beeps on item scan, error buzz on unknown barcodes, and success register chime on payment completion.
- **Stock Guard Protection**: Prevents overselling beyond available real-time warehouse inventory.
- **Manual Product Search Modal**: Search by keyword or filter by grocery categories with instant 1-click cart addition.
- **Live Bill Calculations**: Subtotal, live discount input, 5% VAT, and Grand Total in BDT (`৳`).
- **Payment Methods**: Cash (with live cash received and change due calculator), Card, and bKash.
- **Thermal Receipt Generator**: Generates an 80mm receipt with store branding, bill number, timestamp, cashier name, item breakdown, and barcode.
- **Print Optimization**: Dedicated `@media print` rules for thermal POS receipt printers.
- **Hold & Resume Bills**: Hold current transactions to attend other customers and resume whenever ready.
- **Cashier Shift Performance**: Real-time shift counters (Today's Sales, Bills Count, Items Sold) reflecting only the active cashier's shift.

### 2. Admin Dashboard (`admin.html`)
- **Dynamic KPIs**: Today's Sales, Total Invoices, Low Stock Alerts, and Total Suppliers calculated directly from `localStorage`.
- **Interactive Visualizations**: Weekly sales bar chart and real-time inventory status donut chart powered by Chart.js.
- **Full Products CRUD**: Add, edit, and delete products with duplicate barcode validation. Newly added products are instantly scannable at POS terminals.
- **Inventory & Stock-In Replenishment**: Inward purchase logging that replenishes item stock and tracks supplier shipments.
- **Sales History & Receipt Reprint**: Audit log of all completed transactions with search and 1-click receipt reprint.
- **Financial Reports & CSV Export**: Real-time gross margin calculation and 1-click CSV download (`SuperMart_Sales_Report.csv`).
- **Reset Demo Data**: Factory reset button in Settings that restores original sample products, suppliers, and past transactions anytime.

