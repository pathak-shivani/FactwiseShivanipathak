// Initial 74-Bed Patient Mock Data for Quarantine Facility

const FIRST_NAMES = [
  "Sarah", "David", "Elena", "Marcus", "Emily", "James", "Amina", "Carlos", 
  "Liam", "Olivia", "Noah", "Emma", "Lucas", "Sophia", "Benjamin", "Isabella",
  "Mason", "Mia", "Ethan", "Harper", "Alexander", "Evelyn", "Daniel", "Abigail"
];

const LAST_NAMES = [
  "Jenkins", "Kim", "Rodriguez", "Vance", "Chen", "Patel", "Al-Mansoor", "Silva",
  "O'Connor", "Dubois", "Kowalski", "Nakamura", "Johansson", "Santos", "Müller", "Rossi"
];

const SYMPTOMS_LIST = [
  "Mild dry cough, fatigue",
  "Resolving viral pneumonia, clear lungs",
  "Asymptomatic carrier, isolation day 6",
  "Sore throat, intermittent chills",
  "Recovering, normal respiratory rate (16/min)",
  "Post-viral asthenia, vitals stable",
  "Loss of taste/smell, afebrile",
  "Congestion, oxygen saturation 98%"
];

// Helper to format timestamps
export const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Generates the initial 74 rooms with rich clinical states
export const generateInitialPatients = () => {
  const patients = [];
  const now = new Date();

  for (let i = 1; i <= 74; i++) {
    const roomNumber = 100 + i;
    const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const ln = LAST_NAMES[((i - 1) * 3) % LAST_NAMES.length];
    const name = `${fn} ${ln}`;
    const age = 22 + ((i * 7) % 55);
    const admissionDayOffset = 4 + (i % 10);
    const admittedDate = new Date(now.getTime() - admissionDayOffset * 86400000);
    const symptoms = SYMPTOMS_LIST[i % SYMPTOMS_LIST.length];

    // Curated Demo Patients for immediate testability:
    let dayMinus2Temp, dayMinus1Temp, todayTemp, loggedToday, loggedTime;

    if (i === 1) {
      // Room 101: Ready for Discharge (3 consecutive days < 99.0°F)
      dayMinus2Temp = 98.2;
      dayMinus1Temp = 98.4;
      todayTemp = 98.1;
      loggedToday = true;
      loggedTime = "07:45 AM Today";
    } else if (i === 2) {
      // Room 102: Missing Vitals today -> Triggers Doctor Warning Banner!
      dayMinus2Temp = 98.6;
      dayMinus1Temp = 98.5;
      todayTemp = null;
      loggedToday = false;
      loggedTime = null;
    } else if (i === 3) {
      // Room 103: Active High Fever Today (101.4°F)
      dayMinus2Temp = 99.8;
      dayMinus1Temp = 100.5;
      todayTemp = 101.4;
      loggedToday = true;
      loggedTime = "08:15 AM Today";
    } else if (i === 4) {
      // Room 104: 2/3 Days Afebrile (Day -2 had fever 100.1°F, Day -1 and today normal)
      dayMinus2Temp = 100.1;
      dayMinus1Temp = 98.6;
      todayTemp = 98.4;
      loggedToday = true;
      loggedTime = "08:30 AM Today";
    } else if (i === 5) {
      // Room 105: Another Ready for Discharge candidate
      dayMinus2Temp = 97.9;
      dayMinus1Temp = 98.3;
      todayTemp = 98.2;
      loggedToday = true;
      loggedTime = "09:05 AM Today";
    } else {
      // Algorithmic assignment for rooms 106 - 174
      // 1 in 6 has pending vitals
      loggedToday = (i % 6 !== 0);
      
      const isFeverPatient = (i % 8 === 0);
      const isAfebrileCandidate = (i % 5 === 0);

      if (isFeverPatient) {
        dayMinus2Temp = Number((99.5 + ((i % 5) * 0.3)).toFixed(1));
        dayMinus1Temp = Number((100.0 + ((i % 4) * 0.4)).toFixed(1));
        todayTemp = loggedToday ? Number((100.4 + ((i % 3) * 0.3)).toFixed(1)) : null;
      } else if (isAfebrileCandidate) {
        dayMinus2Temp = Number((98.0 + ((i % 4) * 0.2)).toFixed(1));
        dayMinus1Temp = Number((98.1 + ((i % 3) * 0.2)).toFixed(1));
        todayTemp = loggedToday ? Number((98.2 + ((i % 2) * 0.2)).toFixed(1)) : null;
      } else {
        dayMinus2Temp = Number((98.4 + ((i % 6) * 0.2)).toFixed(1));
        dayMinus1Temp = Number((98.6 + ((i % 5) * 0.2)).toFixed(1));
        todayTemp = loggedToday ? Number((98.5 + ((i % 4) * 0.2)).toFixed(1)) : null;
      }

      loggedTime = loggedToday ? `0${7 + (i % 4)}:${10 + ((i * 5) % 49)} AM Today` : null;
    }

    // Check if meets 3-day no fever rule: all 3 days < 99.0°F
    const meetsDischargeCriteria = Boolean(
      loggedToday &&
      todayTemp !== null &&
      todayTemp < 99.0 &&
      dayMinus1Temp < 99.0 &&
      dayMinus2Temp < 99.0
    );

    patients.push({
      id: i,
      roomNumber,
      bedId: `BED-${roomNumber}`,
      name,
      age,
      gender: i % 2 === 0 ? "Female" : "Male",
      admittedDate: formatDate(admittedDate),
      quarantineDay: admissionDayOffset,
      symptoms,
      loggedToday,
      loggedTime,
      todayTemp,
      vitalsHistory: [
        { day: "Day -2", date: "2 Days Ago", temp: dayMinus2Temp },
        { day: "Day -1", date: "Yesterday", temp: dayMinus1Temp },
        { day: "Today", date: "Today (Official)", temp: todayTemp }
      ],
      dischargeStatus: meetsDischargeCriteria ? "READY" : "IN_TREATMENT", // READY, IN_TREATMENT, DISCHARGED
      dischargedAt: null,
      nurseNotes: loggedToday ? "Morning temperature and pulse logged. Patient in good spirits." : "",
      doctorNotes: "Continue monitoring viral titers and daily vitals sequencing."
    });
  }

  return patients;
};
