# Virus Quarantine & Treatment Facility Management Portal (BioShield)

A fully functional, responsive React & Tailwind CSS web application prototype for managing a 74-bed Virus Quarantine & Clinical Treatment Facility.

## 🚀 Live Demo & Repository
- **GitHub Repository:** [https://github.com/pathak-shivani/FactwiseShivanipathak.git](https://github.com/pathak-shivani/FactwiseShivanipathak.git)

---

## 📋 Core Features & Views

### 1. Dashboard / Overview Screen
- **Capacity Tracking:** Live monitor for 74 patient rooms showing 74/74 full occupancy with an alert state at 100% capacity.
- **Quick Statistics:**
  - Total Active Patients under quarantine.
  - Patients Ready for Discharge.
  - Facility Success Rate benchmarked against the 85.0% target (Current: 88.5%).
- **74-Bed Interactive Directory:** Filter by *All*, *Pending Vitals*, *Active Fever (≥ 99.0°F)*, *Ready for Discharge*, and *Vacant*.

### 2. Nurse View (Daily Vitals & Temperature Tracking)
- **Real-Time Status Indicators:** Visual distinction between `Temperature Recorded Today` vs. `Pending Morning Vitals`.
- **Bedside Vitals Logging Form:** Validated numeric temperature entry (95.0°F to 108.0°F) with instant clinical feedback.
- **Automated Timestamping:** Captures exact server date/time on submission.
- **Patient Vitals History:** Audit trail of previous readings.

### 3. Doctor & Admin View (Clinical Evaluation & Discharge Workflow)
- **Sequential Clinical Warning Banner:** Displays a prominent warning if a doctor attempts to evaluate a patient before morning vitals are logged.
- **3-Day Rolling Fever Tracker:** Evaluates Day -2, Day -1, and Today temperatures against the strict **99.0°F** afebrile threshold.
- **Automated Discharge Logic:** "Ready for Discharge" status indicator and authorization button unlock **only** when the patient has logged 3 consecutive full days without a fever (< 99.0°F).
- **Discharge Action:** Frees up room occupancy immediately (e.g. 74/74 → 73/74) and marks bed for sanitation.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + Lucide React Icons
- **Language:** JavaScript (ES Modules)

---

## 💻 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/pathak-shivani/FactwiseShivanipathak.git

# Navigate to project directory
cd FactwiseShivanipathak

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📄 Documentation Included
- [Quarantine_Facility_App_Specification.md](./Quarantine_Facility_App_Specification.md): Complete PRD, system constraints, prototype highlights, and sprint knapsack optimization calculations.
- [Quarantine_Facility_App_Specification.html](./Quarantine_Facility_App_Specification.html): Microsoft Word-ready formatted specification document.
