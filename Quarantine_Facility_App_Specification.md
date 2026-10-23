# Product Requirements & Sprint Planning Document
## Quarantine & Treatment Facility Application (Version 1.0)

---

### Executive Summary
This document provides the complete product specification, system constraints, prototype structure, and sprint optimization model for **Version 1.0 of the Quarantine & Treatment Facility Application**. The application is designed to streamline healthcare workflows, eliminate paper-based tracking, and manage a **74-bed/room** quarantine facility safely and efficiently.

---

## Q1: User Roles, Core Goals, and Feature Matrix

To eliminate paper-based latency and prevent operational bottlenecks, Version 1 categorizes users into three distinct roles.

### 1. User Persona Overview

| User Role | Core Operational Goal | Primary Workplace Need |
| :--- | :--- | :--- |
| **Nurse** | Record daily patient vitals quickly and reliably before doctor rounds. | Rapid single-click room access, mobile-friendly temperature entry, clear indicators of pending vitals. |
| **Doctor** | Review recovery trends, make clinical decisions, administer treatment, and avoid unproductive room visits. | Pre-visit verification banners, 3-day fever trend charts, and rule-based discharge triggers. |
| **Admin Staff** | Maintain 100% bed utilization awareness, expedite patient turnover, and track clinical safety metrics. | Real-time capacity dashboard (74 rooms), discharge processing queues, and benchmark analytics. |

---

### 2. Role-by-Role Feature Breakdown

#### Role 1: Nurse
* **Primary Objective:** Ensure every patient's vital signs are captured accurately and early in the daily workflow.
* **Relevant Features & Actions:**
  * **Room & Bed Directory:** A visual 74-room grid showing real-time vitals status badges (e.g., `Logged Today` [Green] vs. `Pending Vitals` [Amber]).
  * **Daily Temperature Logger:** Dedicated numeric input screen with automated device timestamping, patient identification check, and instant validation.
  * **Vitals History View:** Chronological log of past temperature readings for the patient to verify data integrity and prevent double-entry mistakes.

#### Role 2: Doctor
* **Primary Objective:** Deliver informed clinical care, prevent cross-contamination or wasted personal protective equipment (PPE) from entering unready rooms, and identify cured patients.
* **Relevant Features & Actions:**
  * **Pre-Visit Vitals Check:** Immediate system status alert on patient profiles indicating whether morning vitals have been recorded prior to room entry.
  * **3-Day Rolling Fever Tracker:** Visual day-by-day temperature trend line and table evaluating recovery against the strict 3-day afebrile (no fever) criterion.
  * **Discharge Recommendation:** Rule-validated action button to transition patients to "Ready for Discharge", instantly notifying facility administrators.
  * **Clinical Treatment Notes:** Streamlined text logging for daily observations, medication administration, and lab results.

#### Role 3: Admin Staff
* **Primary Objective:** Maximize room turnover, eliminate discharge delays, and monitor institutional safety benchmarks.
* **Relevant Features & Actions:**
  * **Facility Capacity Dashboard:** Live tracking of all 74 quarantine rooms (e.g., 74/74 Occupied, Available Beds, Disinfection in Progress).
  * **Expedited Discharge Queue:** Instant alert feed showing patients marked "Ready for Discharge" by attending physicians, enabling bed preparation without administrative delay.
  * **Performance & Safety Analytics:** Real-time KPI widget tracking patient recovery rates and mortality rates benchmarked against the facility standard (85% recovery / 15% expected mortality).

---

## Q2: Functional Prototype Specifications & Architecture

### 1. Deployment Details
* **Live Deployment Link:** [https://quarantine-facility-prototype.vercel.app](https://quarantine-facility-prototype.vercel.app) *(Replace with your deployed URL)*
* **Target Device Form Factors:** Responsive Tablet & Desktop (Optimized for mobile bedside rounds and desktop nursing stations).

---

### 2. Prototype Core Screens

```
+----------------------------------------------------------------------------------------------------+
|                                    QUARANTINE FACILITY PROTOTYPE                                    |
+----------------------------------------------------------------------------------------------------+
|  [Screen 1: Facility Dashboard]    -->  Capacity: 74/74 (100% Full) | Filter: All / Fever / Ready  |
|  [Screen 2: Nurse Station]         -->  Quick Select Room | Input Temp (°F) | One-Click Log Vitals |
|  [Screen 3: Doctor / Admin Console]-->  Pre-Visit Alert | 3-Day Fever Trend | Discharge Workflow   |
+----------------------------------------------------------------------------------------------------+
```

#### Screen 1: Facility Capacity & Room Directory Overview
* **Capacity Header:** Displays dynamic bed occupancy (`74 / 74 Beds Occupied - 100% Capacity`). Counter turns red when full.
* **Room Matrix Grid:** Interactive cards for Rooms 101 through 174 displaying:
  * Patient Name & Room Number
  * Today's Vitals Status Badge (`Recorded` vs. `Pending`)
  * Clinical Status (`Afebrile`, `Active Fever`, `Ready for Discharge`)
* **Filtering & Search Bar:** Filter by room number, nurse assignment, or fever status.

#### Screen 2: Nurse Station & Temperature Logging Interface
* **Patient Identity Confirmation:** Room number, Patient Name, Admission Date, and Primary Diagnosis.
* **Interactive Numeric Pad / Stepper:** Quick-entry for temperature readings in degrees Fahrenheit (e.g., `98.6°F`).
* **Instant Validation Feedback:** Rejects physiologically impossible readings outside 95.0°F – 108.0°F.
* **Auto-Timestamp:** Generates date and exact local time (`YYYY-MM-DD HH:MM:SS`) on submission.
* **Vitals Audit Log:** Displays previous readings recorded throughout the stay.

#### Screen 3: Doctor Clinical Console & Admin Discharge Queue
* **Pre-Visit Warning Banner:** Prominent notification if today's vitals have not yet been logged.
* **3-Day Temperature Trend Visualization:** Visual graph showing maximum daily temperatures across Day -2, Day -1, and Today relative to the fever threshold (100.4°F).
* **Automated Discharge Eligibility Guard:**
  * Displays: `Clinical Criteria: 3 Consecutive Days Without Fever`.
  * Status: `Criteria Met (3/3 Days)` or `Criteria Incomplete (X/3 Days)`.
* **Discharge Action Trigger:** Unlocks the "Mark for Discharge" button only when criteria are met; triggers instantaneous alert on the Admin Discharge Queue.

---

## Q3: Logical Constraints & System Validation Rules

To safeguard patient health, prevent premature discharges, and maintain operational data integrity, developers must enforce the following business logic:

### 1. Temperature Logging & Data Integrity
* **Multiple Intraday Readings:** Nurses may log multiple temperature checks per day for high-acuity patients.
* **Official Reading Resolution:** The system automatically marks each entry with an immutable UTC timestamp. The **latest recorded reading** for the calendar day is designated as the official daily metric for clinical discharge evaluation.
* **Physiological Range Validation:**
  * Lower Bound: Readings below **95.0°F (35.0°C)** are rejected with the error: *"Invalid Reading: Temperature below 95°F is clinically improbable. Please re-check thermometer."*
  * Upper Bound: Readings above **108.0°F (42.2°C)** are rejected with the error: *"Invalid Reading: Temperature above 108°F requires immediate emergency triage verification."*
* **Date/Time Constraints:** The system automatically locks the timestamp to server time. Manual date/time overrides and future date submissions are strictly prohibited.

### 2. Doctor Visit Sequencing & Clinical Warning System
* **Sequential Dependency:** Clinical protocols require morning vitals to be documented before physician evaluation to conserve protective gear and ensure productive consultations.
* **Warning Banner Logic:** When a doctor accesses a patient record where `Today_Vitals_Logged == False`, the system renders a high-visibility amber warning banner:
  > **⚠️ Warning: Patient temperature has not been recorded today.**
  > *Please coordinate with the floor nurse or record vital signs first to prevent workflow delays and unnecessary room entries.*
* **Emergency Override:** The doctor may dismiss the banner with a single click if entering for emergency acute treatment.

### 3. Automated Discharge Eligibility Algorithm
* **Strict Default State:** The "Mark for Discharge" button must remain **disabled (`disabled=true`)** and greyed out by default.
* **Eligibility Evaluation Rules:**
  1. The system evaluates the maximum recorded temperature for each of the last **three consecutive calendar days (72 hours)**.
  2. Every reading across all 3 days must remain strictly below the fever threshold (**< 100.4°F / 38.0°C**).
  3. No calendar day within the 3-day window may have missing vitals.
* **State Transition:** Only when all conditions are satisfied does the button become active. Clicking it changes patient state to `Ready for Discharge` and generates an administrative event.

### 4. Facility Capacity & Workflow Bottleneck Alerts
* **Capacity Overflow Alert:**
  * When `Active_Occupancy == 74`, the dashboard banner and occupancy badge immediately switch to an alert state (**Red Badge: 74/74 - Capacity Reached**).
  * New admission actions are locked unless an override is authorized.
* **Extended Stay Inefficiency Alert (4-Hour Bottleneck Rule):**
  * If a patient's status has been updated to `Ready for Discharge` by a doctor, a background timer initiates.
  * If the patient is not processed and the room cleared within **4.0 hours**, the Admin Dashboard displays an escalating visual alert:
  > **🚨 Discharge Bottleneck: Room [XXX] cleared by doctor > 4 hours ago. Please expedite bed turnover.**

---

## Q4: Sprint Planning & Optimization Analysis

### 1. Capacity & Velocity Baseline
* **Total Team Velocity:** 25 Story Points
* **Committed / Pre-allocated Work:** 3 stories × 5 points each = **15 Story Points**
* **Available Sprint Capacity:** 25 - 15 = **10 Story Points**

### 2. Value Multiplier Weights
* **High Priority Stories:** Value Weight = **6×**
* **Medium Priority Stories:** Value Weight = **3×**
* **Low Priority Stories:** Value Weight = **1×**

---

### 3. Feature Evaluation Matrix (Value-to-Effort Ratio)

| Feature ID | Priority Level | Effort (Story Points) | Business Value Score | Value-to-Effort Ratio | Backlog Rank |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Feature J** | Low | 0.1 | 1 × 1 = 1 | **10.00** | 1 |
| **Feature A** | High | 1.0 | 1 × 6 = 6 | **6.00** | 2 |
| **Feature I** | Low | 0.3 | 1 × 1 = 1 | **3.33** | 3 |
| **Feature F** | Medium | 1.0 | 1 × 3 = 3 | **3.00** | 4 |
| **Feature G** | Low | 0.4 | 1 × 1 = 1 | **2.50** | 5 |
| **Feature B** | High | 3.0 | 1 × 6 = 6 | **2.00** | 6 |
| **Feature H** | Low | 0.5 | 1 × 1 = 1 | **2.00** | 7 |
| **Feature D** | Medium | 2.0 | 1 × 3 = 3 | **1.50** | 8 |
| **Feature C** | High | 5.0 | 1 × 6 = 6 | **1.20** | 9 |
| **Feature E** | Medium | 3.0 | 1 × 3 = 3 | **1.00** | 10 |

---

### 4. Step-by-Step Selection Analysis

To maximize delivered business value while minimizing effort within the **10.0 story point** capacity limit:

#### Step 1: Select High-Impact & High-Efficiency Features
1. **Feature A** (High Priority, Effort: 1.0, Value: 6) → Cumulative Effort = **1.0 pt** | Value = **6**
2. **Feature B** (High Priority, Effort: 3.0, Value: 6) → Cumulative Effort = **4.0 pts** | Value = **12**
3. **Feature F** (Medium Priority, Effort: 1.0, Value: 3) → Cumulative Effort = **5.0 pts** | Value = **15**
4. **Feature D** (Medium Priority, Effort: 2.0, Value: 3) → Cumulative Effort = **7.0 pts** | Value = **18**
5. **Feature J** (Low Priority, Effort: 0.1, Value: 1) → Cumulative Effort = **7.1 pts** | Value = **19**
6. **Feature I** (Low Priority, Effort: 0.3, Value: 1) → Cumulative Effort = **7.4 pts** | Value = **20**
7. **Feature G** (Low Priority, Effort: 0.4, Value: 1) → Cumulative Effort = **7.8 pts** | Value = **21**

---

### 5. Final Sprint Recommendation & Capacity Breakdown

#### Selected Sprint Backlog:
Add **Features A, B, F, D, J, I, and G** to the upcoming sprint.

#### Sprint Metrics Summary:
* **Total Stories Committed:** 7 candidate features + 3 pre-allocated stories
* **Effort Utilized:** **7.8 Story Points** (out of 10.0 available)
* **Total New Business Value Generated:** **21 Value Points**
* **Sprint Buffer / Safety Margin:** **2.2 Story Points** remaining to absorb unexpected edge-case bugs, testing overhead, and deployment stabilization.

> **Optional Capacity Optimization Note:**
> If the engineering team wishes to exhaust the remaining capacity completely:
> * **Feature H** (Effort: 0.5, Value: 1) can also be added, bringing the total effort to **8.3 points** and total value to **22 Value Points**, leaving an agile safety buffer of **1.7 points**.
