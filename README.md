# Tailor Shop Management Dashboard

A CRM and operations dashboard built for tailor shops. Manages client profiles, body measurements, garment orders, and daily tasks in a single interface.

---

## Features

- **Dashboard** — Overview of total clients, active sessions, orders ready for pickup, and new sessions this week
- **Client Database** — Per-client records storing name, phone number, email, body measurements, and full garment history
- **Body Measurements** — Measurements stored in list format and visualized on an interactive body diagram
- **Sessions / Orders** — Track orders by service type (Bespoke, MTM), garment type, status (Active, Fitting, Pickup, Completed), and date
- **Tasks** — Shop to-do list for daily operations
- **Search** — Global search across clients and sessions
- **Authentication** — Secure login via Supabase Auth

---

## Prerequisites

- Node.js 18+
- A Supabase project with Auth enabled

---

## Installation

```bash
git clone https://github.com/your-username/tailor-dashboard.git
cd tailor-dashboard
npm install
```

---

## Configuration

Create a `.env` file in the project root with these test keys:

```env
VITE_SUPABASE_URL=https://deukvvjkicatrhxmrbcc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldWt2dmpraWNhdHJoeG1yYmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzA5MjgsImV4cCI6MjA3ODU0NjkyOH0.2WTvW8Ap0FT8ILmMd-oFbktTkCRXFfLa3DNlFxLaOIQ

```

Both values are found in your Supabase project under **Settings → API**.

---

## Usage

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build Locally

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3, PostCSS, Autoprefixer |
| Icons | Lucide React |
| Backend / Database | Supabase (Auth, Database, Storage) |
| Linting | ESLint v9, TypeScript ESLint |

---

## Demo

Live preview: [https://tailor-dashboard-tawny.vercel.app](https://tailor-dashboard-tawny.vercel.app)

Test credentials:

```
Email:    davick2310@gmail.com
Password: dashboard_test_1
```

---

## Known Limitations

- Body diagram measurement points are approximate and currently being refined for anatomical accuracy

---

## License

Not yet determined. All rights reserved in the interim.