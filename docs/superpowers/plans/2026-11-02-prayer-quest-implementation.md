# Daily Prayer Quest (Steam Gaming & Islamic HUD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, responsive React + Vite + Tailwind CSS Single Page Application for tracking daily prayers, missed rak'ahs, and Sunnah prayers with a Steam gaming HUD aesthetic and Islamic geometric accents, running client-side with IndexedDB and deployable to GitHub Pages.

**Architecture:** React 18 modular components with Tailwind CSS for dark/light themes. State management with local hooks and IndexedDB persistence. Pure client-side calculations for scoring and analytics. HTML5 canvas & jsPDF for exporting reports.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide React, IndexedDB (idb wrapper or raw indexedDB API), Canvas/jsPDF for export.

**Spec:** `docs/PROJECT_SPECIFICATION.md`

## Global Constraints
- Target platform: Client-side web (GitHub Pages compatible, relative base paths in Vite).
- Themes: Dark Mode (Deep Navy `#0B132B` / `#1C2541` + Vibrant Orange `#FF7A00`) and Light Mode.
- Scoring: 100 points per Fard prayer. Takbirat Al-Ihram = 20 pts (triggers 100 pts auto). Missed Takbirah with all rak'ahs = 80 pts. Rak'ahs split: Fajr (40/rk), Dhuhr/Asr/Isha (20/rk), Maghrib (26.67/rk).
- Sunnah prayers: separate 100 pts track.
- Calendar: side drawer for day inspection and editing; future dates strictly disabled.
- Analytics: filtered table for days with missed rak'ahs only.
- Matrix: monthly sheet with ✓ for full mosque prayer and missed rak'ah count.

---

### Task 1: Project Initialization & Build Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.jsx`
- Create: `src/App.jsx`

- [ ] **Step 1: Create package.json with dependencies**
- [ ] **Step 2: Configure Vite with relative base path and Tailwind**
- [ ] **Step 3: Setup Tailwind CSS with custom gaming & islamic color tokens**
- [ ] **Step 4: Install dependencies via npm**
- [ ] **Step 5: Verify build works with `npm run build`**
- [ ] **Step 6: Commit initialization**

---

### Task 2: Core Scoring Engine & Unit Logic

**Files:**
- Create: `src/services/scoring.js`
- Create: `src/tests/scoring.test.js`

- [ ] **Step 1: Define prayer definitions and scoring rules**
- [ ] **Step 2: Implement calculatePrayerScore function**
- [ ] **Step 3: Implement calculateDayScore function (Fard + Sunnah)**
- [ ] **Step 4: Write node verification test for scoring rules**
- [ ] **Step 5: Run tests and verify all rules pass**
- [ ] **Step 6: Commit scoring service**

---

### Task 3: Storage Engine (IndexedDB & Export/Import)

**Files:**
- Create: `src/services/db.js`

- [ ] **Step 1: Implement IndexedDB database initialization**
- [ ] **Step 2: Implement getDayRecord, saveDayRecord, getMonthRecords**
- [ ] **Step 3: Implement exportAllDataAsJSON and importDataFromJSON**
- [ ] **Step 4: Commit db service**

---

### Task 4: Layout & Gaming HUD UI Components

**Files:**
- Create: `src/components/IslamicPattern.jsx`
- Create: `src/components/Navbar.jsx`
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/DayDrawer.jsx`

- [ ] **Step 1: Create SVG Islamic geometric pattern background component**
- [ ] **Step 2: Build Steam-inspired top Navbar with Streak, Level, and Dark/Light toggle**
- [ ] **Step 3: Build gaming Sidebar with navigation tabs and HUD accents**
- [ ] **Step 4: Build sliding side drawer for day inspection and editing**
- [ ] **Step 5: Commit layout components**

---

### Task 5: Pages Implementation

**Files:**
- Create: `src/pages/TodayPage.jsx`
- Create: `src/pages/CalendarPage.jsx`
- Create: `src/pages/MissedRakatsPage.jsx`
- Create: `src/pages/MosqueTrackerPage.jsx`
- Create: `src/pages/ExportPage.jsx`

- [ ] **Step 1: Build TodayPage with interactive Fard cards, Takbirah auto-100%, and Sunnah track**
- [ ] **Step 2: Build CalendarPage with grid, future dates locked, and side drawer integration**
- [ ] **Step 3: Build MissedRakatsPage with stats and filtered table showing ONLY days with lost rak'ahs**
- [ ] **Step 4: Build MosqueTrackerPage for missed mosque prayers and Sunnah compliance**
- [ ] **Step 5: Build ExportPage with monthly matrix table (✓ / count) and PDF/PNG export tools**
- [ ] **Step 6: Integrate all pages into App.jsx**
- [ ] **Step 7: Commit pages**

---

### Task 6: Testing, Production Build & GitHub Push

**Files:**
- Modify: `README.md`
- Build: `dist/`

- [ ] **Step 1: Execute `npm run build` and ensure clean exit 0**
- [ ] **Step 2: Verify application assets and interactive flow**
- [ ] **Step 3: Commit and push all changes to GitHub `main` branch**
