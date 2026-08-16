# ✈️ AeroTurn - Airport Ground Turnaround & Operations Control

A next-generation Airport Ground Handling and Turnaround Management System built with **Laravel 12**, **React 19**, **Vite**, **Tailwind CSS**, and **Google Gemini AI**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **PHP 8.2+** with Composer
- **Node.js 18+** with npm

### 2. Installation
```bash
# Clone the repository (if not already cloned)
git clone https://github.com/ourabi410/airport-ground-ops.git
cd airport-ground-ops

# Install PHP dependencies
composer install

# Install Frontend dependencies
npm install

# Setup environment variables
cp .env.example .env
php artisan key:generate
```

### 3. Running the Application

In two terminal windows (or using `composer dev`):

**Terminal 1 (Backend - Laravel):**
```bash
php artisan serve
```

**Terminal 2 (Frontend - React / Vite):**
```bash
npm run dev
```

Open your browser at **`http://localhost:8000`** (or the port displayed by `php artisan serve`).

---

## 🛠️ Tech Stack & Features

- **Backend**: Laravel 12 API with REST endpoints, idempotent offline batch synchronization, audit logs, and Gemini AI turnaround analysis.
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Vite Asset Pipeline**: Integrated with `@vitejs/plugin-react` and `laravel-vite-plugin`.
- **Features**:
  - Live turnaround dashboard & Gantt schedule timeline
  - Zebra barcode & baggage RFID scanner simulation
  - Mobile Ramp Agent quick mode
  - Geofenced Apron radar map
  - Delay prediction & AI advisory
  - Real-time offline IndexedDB queue & authoritative server sync
