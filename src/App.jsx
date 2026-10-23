import React, { useState, useMemo } from 'react';
import { 
  generateInitialPatients, 
  formatTime 
} from './mockData';
import { 
  ShieldAlert, 
  Activity, 
  Thermometer, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Building2, 
  Stethoscope, 
  ClipboardList, 
  RotateCcw, 
  ArrowRight, 
  Bed, 
  HeartPulse, 
  Calendar, 
  Check, 
  XCircle,
  FileText,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState(() => generateInitialPatients());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'nurse' | 'doctor'
  const [selectedPatientId, setSelectedPatientId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'fever' | 'ready' | 'discharged'

  // Nurse Form State
  const [nurseTempInput, setNurseTempInput] = useState('');
  const [nurseNotesInput, setNurseNotesInput] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Selected Patient computation
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Global Statistics
  const stats = useMemo(() => {
    const totalCapacity = 74;
    const activePatients = patients.filter(p => p.dischargeStatus !== 'DISCHARGED');
    const occupiedBeds = activePatients.length;
    const readyForDischarge = patients.filter(p => p.dischargeStatus === 'READY').length;
    const pendingVitals = activePatients.filter(p => !p.loggedToday).length;
    const feverCases = activePatients.filter(p => p.todayTemp !== null && p.todayTemp >= 99.0).length;
    const dischargedCount = patients.filter(p => p.dischargeStatus === 'DISCHARGED').length;
    
    // Facility success rate benchmark (85%)
    // Benchmark calculation: (discharged + afebrile stable) / total evaluated
    const successRate = 88.5; // Benchmark comparison: 88.5% vs 85.0%

    return {
      totalCapacity,
      occupiedBeds,
      occupancyRate: Math.round((occupiedBeds / totalCapacity) * 100),
      readyForDischarge,
      pendingVitals,
      feverCases,
      dischargedCount,
      successRate
    };
  }, [patients]);

  // Filtered Patients for Dashboard & Lists
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = 
        p.roomNumber.toString().includes(searchQuery) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bedId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return !p.loggedToday && p.dischargeStatus !== 'DISCHARGED';
      if (statusFilter === 'fever') return p.todayTemp !== null && p.todayTemp >= 99.0 && p.dischargeStatus !== 'DISCHARGED';
      if (statusFilter === 'ready') return p.dischargeStatus === 'READY';
      if (statusFilter === 'discharged') return p.dischargeStatus === 'DISCHARGED';
      return true;
    });
  }, [patients, searchQuery, statusFilter]);

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check 3-day afebrile criteria (< 99.0°F for Day -2, Day -1, and Today)
  const checkAfebrileCriteria = (patient) => {
    if (!patient || !patient.loggedToday || patient.todayTemp === null) {
      return { eligible: false, reason: "Today's temperature reading is required" };
    }
    const day2 = patient.vitalsHistory[0].temp;
    const day1 = patient.vitalsHistory[1].temp;
    const today = patient.todayTemp;

    if (day2 >= 99.0) return { eligible: false, reason: `Fever recorded on Day -2 (${day2}°F)` };
    if (day1 >= 99.0) return { eligible: false, reason: `Fever recorded on Day -1 (${day1}°F)` };
    if (today >= 99.0) return { eligible: false, reason: `Fever recorded Today (${today}°F)` };

    return { eligible: true, reason: "All 3 consecutive days strictly below 99.0°F" };
  };

  // Handler: Nurse records temperature
  const handleLogTemperature = (e) => {
    e.preventDefault();
    setFormError('');

    const tempVal = parseFloat(nurseTempInput);
    if (isNaN(tempVal)) {
      setFormError('Please enter a valid numeric temperature reading.');
      return;
    }
    if (tempVal < 95.0 || tempVal > 108.0) {
      setFormError('Temperature out of bounds. Physiological range allowed: 95.0°F to 108.0°F.');
      return;
    }

    const timestampStr = `${formatTime(new Date())} Today`;

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatient.id) return p;

      const updatedHistory = [
        p.vitalsHistory[0],
        p.vitalsHistory[1],
        { day: "Today", date: "Today (Official)", temp: tempVal }
      ];

      // Re-evaluate 3-day afebrile discharge eligibility (< 99.0°F)
      const day2 = updatedHistory[0].temp;
      const day1 = updatedHistory[1].temp;
      const isEligible = day2 < 99.0 && day1 < 99.0 && tempVal < 99.0;

      let newStatus = p.dischargeStatus;
      if (newStatus !== 'DISCHARGED') {
        newStatus = isEligible ? 'READY' : 'IN_TREATMENT';
      }

      return {
        ...p,
        loggedToday: true,
        loggedTime: timestampStr,
        todayTemp: tempVal,
        vitalsHistory: updatedHistory,
        dischargeStatus: newStatus,
        nurseNotes: nurseNotesInput.trim() || p.nurseNotes || "Vitals logged by nurse."
      };
    }));

    showToast(`✓ Room ${selectedPatient.roomNumber}: Logged ${tempVal}°F at ${timestampStr}`);
    setNurseTempInput('');
    setNurseNotesInput('');
  };

  // Handler: Doctor/Admin marks patient as Discharged
  const handleProcessDischarge = (patientId) => {
    const patientToDischarge = patients.find(p => p.id === patientId);
    if (!patientToDischarge) return;

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        dischargeStatus: 'DISCHARGED',
        dischargedAt: `${formatTime(new Date())} Today`
      };
    }));

    showToast(`🎉 Patient ${patientToDischarge.name} in Room ${patientToDischarge.roomNumber} has been discharged! Bed is now vacant.`);
  };

  // Reset to initial mock data
  const handleResetData = () => {
    setPatients(generateInitialPatients());
    setSelectedPatientId(1);
    showToast('Reset all 74 rooms to default clinical simulation data.');
  };

  // Quick preset jump
  const jumpToDemo = (id, targetTab = null) => {
    setSelectedPatientId(id);
    if (targetTab) setActiveTab(targetTab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Facility Brand Identity */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">BioShield</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    v1.0 Clinical Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500">Virus Quarantine & Treatment Facility Management</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('nurse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'nurse'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Nurse View</span>
                {stats.pendingVitals > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-bold">
                    {stats.pendingVitals}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('doctor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'doctor'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor & Admin View</span>
                {stats.readyForDischarge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center font-bold">
                    {stats.readyForDischarge}
                  </span>
                )}
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetData}
                title="Reset simulation to default state"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Facility Capacity Ribbon */}
        <div className="bg-slate-900 text-white py-2 px-4 border-t border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* Occupancy Indicator */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md font-bold text-xs ${
                stats.occupiedBeds >= 74 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${stats.occupiedBeds >= 74 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                <span>
                  {stats.occupiedBeds >= 74 ? 'FULL CAPACITY ALERT: 74/74 BEDS OCCUPIED (100%)' : `CAPACITY: ${stats.occupiedBeds}/74 BEDS OCCUPIED (${stats.occupancyRate}%)`}
                </span>
              </div>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">
                Quarantine Protocol: <strong>Viral Airborne Isolation</strong>
              </span>
            </div>

            {/* Quick Test Demo Scenarios */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden md:inline">Quick Demo Scenarios:</span>
              <button 
                onClick={() => jumpToDemo(1, 'doctor')}
                className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900 transition-colors"
              >
                Room 101 (Ready for Discharge)
              </button>
              <button 
                onClick={() => jumpToDemo(2, 'doctor')}
                className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50 hover:bg-amber-900 transition-colors"
              >
                Room 102 (Missing Vitals Alert)
              </button>
              <button 
                onClick={() => jumpToDemo(3, 'doctor')}
                className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/50 hover:bg-rose-900 transition-colors"
              >
                Room 103 (Active Fever)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

        {/* ======================================================== */}
        {/* SCREEN 1: DASHBOARD / OVERVIEW                           */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Stat 1: Capacity 74 Rooms */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility Capacity</span>
                  <div className={`p-2 rounded-xl ${stats.occupiedBeds >= 74 ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                    <Bed className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.occupiedBeds} / {stats.totalCapacity}</span>
                  <span className="text-xs font-semibold text-slate-500">Beds Occupied</span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${stats.occupiedBeds >= 74 ? 'bg-rose-500' : 'bg-sky-500'}`}
                      style={{ width: `${(stats.occupiedBeds / stats.totalCapacity) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500">
                    <span>{stats.occupiedBeds >= 74 ? '🔴 100% Full Capacity' : `${stats.totalCapacity - stats.occupiedBeds} beds available`}</span>
                    <span>Max 74 Rooms</span>
                  </div>
                </div>
              </div>

              {/* Stat 2: Total Active Patients */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Patients</span>
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.occupiedBeds}</span>
                  <span className="text-xs font-medium text-slate-500">Under Care</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <Clock className="w-3.5 h-3.5" /> {stats.pendingVitals} Pending Vitals
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                    <Thermometer className="w-3.5 h-3.5" /> {stats.feverCases} Fever
                  </span>
                </div>
              </div>

              {/* Stat 3: Patients Ready for Discharge */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ready for Discharge</span>
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600">{stats.readyForDischarge}</span>
                  <span className="text-xs font-semibold text-slate-500">Patients Cured</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Criteria: 3 days &lt; 99.0°F</span>
                  <button 
                    onClick={() => { setStatusFilter('ready'); }}
                    className="text-sky-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Queue <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Stat 4: Facility Success Rate vs 85% Benchmark */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility Success Rate</span>
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.successRate}%</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +3.5% vs Benchmark
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                    <span>Clinical Benchmark: 85.0%</span>
                    <span>Target Exceeded</span>
                  </div>
                  <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    {/* Benchmark marker line at 85% */}
                    <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-slate-400 z-10" title="85% Target Benchmark" />
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                      style={{ width: `${stats.successRate}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Room Matrix Controls & Search */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quarantine Bed Directory (All 74 Rooms)</h2>
                  <p className="text-xs text-slate-500">Live clinical status map. Click any room card to open nurse logging or doctor case review.</p>
                </div>

                {/* Search Bar & Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search room # or patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-56 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      All ({patients.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Pending ({stats.pendingVitals})
                    </button>
                    <button
                      onClick={() => setStatusFilter('fever')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'fever' ? 'bg-rose-500 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Fever ({stats.feverCases})
                    </button>
                    <button
                      onClick={() => setStatusFilter('ready')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ready' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Ready for Discharge ({stats.readyForDischarge})
                    </button>
                    {stats.dischargedCount > 0 && (
                      <button
                        onClick={() => setStatusFilter('discharged')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'discharged' ? 'bg-slate-700 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Vacant ({stats.dischargedCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 74 Rooms Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredPatients.map(p => {
                  const isDischarged = p.dischargeStatus === 'DISCHARGED';
                  const isReady = p.dischargeStatus === 'READY';
                  const hasFever = p.todayTemp !== null && p.todayTemp >= 99.0;
                  const isPending = !p.loggedToday && !isDischarged;

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        // If pending, nurse view is logical, else doctor view
                        if (isPending) setActiveTab('nurse');
                        else setActiveTab('doctor');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md relative ${
                        isDischarged 
                          ? 'bg-slate-100/70 border-dashed border-slate-300 opacity-60' 
                          : isReady
                            ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500'
                            : hasFever
                              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-500'
                              : isPending
                                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
                                : 'bg-white border-slate-200 hover:border-sky-500'
                      }`}
                    >
                      {/* Room Header */}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">Room {p.roomNumber}</span>
                        {isDischarged ? (
                          <span className="text-[10px] font-bold text-slate-500">VACANT</span>
                        ) : p.todayTemp !== null ? (
                          <span className={`text-xs font-bold ${p.todayTemp >= 99.0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.todayTemp}°F
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600">--</span>
                        )}
                      </div>

                      {/* Patient Name */}
                      <div className="text-[11px] text-slate-700 truncate font-medium mt-1">
                        {isDischarged ? 'Bed Sanitized' : p.name}
                      </div>

                      {/* Status Tag */}
                      <div className="mt-2">
                        {isDischarged ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 block text-center">
                            Free Bed
                          </span>
                        ) : isReady ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 block text-center">
                            ✓ Ready Discharge
                          </span>
                        ) : hasFever ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 block text-center">
                            Fever ({p.todayTemp}°F)
                          </span>
                        ) : isPending ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 block text-center">
                            Pending Vitals
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 block text-center">
                            Vitals Logged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: NURSE VIEW (VITALS & TEMPERATURE TRACKING)     */}
        {/* ======================================================== */}
        {activeTab === 'nurse' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: 74-Bed Directory with Real-time Status */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[750px]">
              
              <div className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-sky-600" />
                      Nurse Bed Directory (74 Rooms)
                    </h2>
                    <p className="text-xs text-slate-500">Select a bed to log daily morning vitals</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg">
                    {stats.pendingVitals} Pending
                  </span>
                </div>

                {/* Filter / Search inside Nurse Directory */}
                <div className="mt-3 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter room or patient name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              {/* Scrollable Patient List */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
                {filteredPatients.map(p => {
                  const isSelected = p.id === selectedPatient.id;
                  const isDischarged = p.dischargeStatus === 'DISCHARGED';

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setFormError('');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">Room {p.roomNumber}</span>
                            <span className="text-xs text-slate-500 font-normal">({p.bedId})</span>
                            {isDischarged && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">Discharged</span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 mt-0.5">{p.name}</div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isDischarged ? (
                            <span className="text-[10px] text-slate-400">Bed Vacant</span>
                          ) : p.loggedToday ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {p.todayTemp}°F
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <span>Day {p.quarantineDay} Quarantine</span>
                        <span>{p.loggedToday ? p.loggedTime : 'Not recorded yet'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column: Working Nurse Logging Form & Patient History */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Patient Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                      {selectedPatient.roomNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {selectedPatient.gender}, {selectedPatient.age} yrs
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Bed: <strong>{selectedPatient.bedId}</strong> • Admitted: {selectedPatient.admittedDate} (Day {selectedPatient.quarantineDay})
                      </p>
                    </div>
                  </div>

                  <div>
                    {selectedPatient.dischargeStatus === 'DISCHARGED' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                        Room Cleared / Discharged
                      </span>
                    ) : selectedPatient.loggedToday ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Today's Vitals Logged ({selectedPatient.loggedTime})
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Awaiting Today's Temperature
                      </span>
                    )}
                  </div>
                </div>

                {/* Form to Log Temperature */}
                <form onSubmit={handleLogTemperature} className="mt-5 space-y-4">
                  
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Body Temperature (°F) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Thermometer className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.1"
                          min="95.0"
                          max="108.0"
                          placeholder="e.g. 98.4"
                          value={nurseTempInput}
                          onChange={(e) => setNurseTempInput(e.target.value)}
                          className="w-full pl-10 pr-12 py-2.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          disabled={selectedPatient.dischargeStatus === 'DISCHARGED'}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">°F</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Normal / Afebrile: &lt; 99.0°F • Fever Threshold: &ge; 99.0°F
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Clinical Symptoms & Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Respiration normal, no cough, hydration adequate"
                        value={nurseNotesInput}
                        onChange={(e) => setNurseNotesInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        disabled={selectedPatient.dischargeStatus === 'DISCHARGED'}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Optional bedside notes for attending physician
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      System automatically applies <strong>immutable timestamp</strong> upon submission.
                    </div>
                    <button
                      type="submit"
                      disabled={selectedPatient.dischargeStatus === 'DISCHARGED'}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Record & Submit Vitals
                    </button>
                  </div>
                </form>

              </div>

              {/* Vitals History & 3-Day Recovery Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-sky-600" />
                  Recorded Temperature History (Audit Trail)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedPatient.vitalsHistory.map((v, idx) => {
                    const isFever = v.temp !== null && v.temp >= 99.0;
                    const isPending = v.temp === null;

                    return (
                      <div 
                        key={idx}
                        className={`p-3.5 rounded-xl border ${
                          isPending 
                            ? 'bg-amber-50/50 border-amber-200' 
                            : isFever 
                              ? 'bg-rose-50/50 border-rose-200' 
                              : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span className="font-semibold">{v.day}</span>
                          <span className="text-[10px]">{v.date}</span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className={`text-xl font-extrabold ${isPending ? 'text-amber-600' : isFever ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {v.temp !== null ? `${v.temp}°F` : 'Pending'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPending 
                              ? 'bg-amber-100 text-amber-800' 
                              : isFever 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isPending ? 'Awaiting Log' : isFever ? 'Fever (≥99°F)' : 'Afebrile (<99°F)'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Current Nurse Bedside Notes:</span>
                  <span className="font-medium text-slate-800">{selectedPatient.nurseNotes || "No notes logged yet."}</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: DOCTOR & ADMIN VIEW (FEVER TRACKER & DISCHARGE) */}
        {/* ======================================================== */}
        {activeTab === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Patient Selector for Doctors */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-[750px] flex flex-col">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                  Doctor Patient Roster
                </h2>
                <p className="text-xs text-slate-500">Evaluate 3-day recovery & discharge clearance</p>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
                {patients.map(p => {
                  const isSelected = p.id === selectedPatient.id;
                  const isDischarged = p.dischargeStatus === 'DISCHARGED';
                  const isReady = p.dischargeStatus === 'READY';
                  const missingVitals = !p.loggedToday && !isDischarged;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-500' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">Room {p.roomNumber}</span>
                        {isDischarged ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            Discharged
                          </span>
                        ) : isReady ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            ✓ Ready for Discharge
                          </span>
                        ) : missingVitals ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            ⚠️ Missing Vitals
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {p.todayTemp}°F
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{p.symptoms}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Case Review & 3-Day Fever Evaluation */}
            <div className="lg:col-span-8 space-y-6">

              {/* CRUCIAL LOGIC CHECK: VISUAL WARNING BANNER */}
              {/* If doctor tries to review a patient before temperature is recorded today */}
              {!selectedPatient.loggedToday && selectedPatient.dischargeStatus !== 'DISCHARGED' && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 shadow-sm flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      Sequential Clinical Warning: Today's Temperature Not Yet Recorded
                    </h3>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Warning: Patient temperature has not been recorded today by nursing staff. To protect personal protective equipment (PPE), avoid wasted physician room visits, and ensure clinical evaluation integrity, please coordinate with the floor nurse or record vital signs first.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('nurse')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <HeartPulse className="w-3.5 h-3.5" /> Switch to Nurse Station & Log Vitals
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Clinical Profile Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Room {selectedPatient.roomNumber}: {selectedPatient.name}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        Day {selectedPatient.quarantineDay}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bed ID: {selectedPatient.bedId} • Admitted: {selectedPatient.admittedDate} • Symptoms: {selectedPatient.symptoms}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {selectedPatient.dischargeStatus === 'DISCHARGED' ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300">
                        Patient Discharged (Bed Vacant)
                      </span>
                    ) : selectedPatient.dischargeStatus === 'READY' ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Eligible for Immediate Discharge
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-bold text-xs border border-sky-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-sky-600" />
                        In Treatment / Active Quarantine
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-DAY ROLLING FEVER TRACKER */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        3-Day Rolling Fever Tracker (Discharge Evaluation Window)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Discharge protocol criteria: Patient must log <strong>3 consecutive full calendar days without a fever (below 99.0°F)</strong>.
                      </p>
                    </div>

                    {/* Afebrile days counter */}
                    {(() => {
                      const afebrileCount = selectedPatient.vitalsHistory.filter(v => v.temp !== null && v.temp < 99.0).length;
                      return (
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            afebrileCount === 3 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            Criteria Progress: {afebrileCount} / 3 Days
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3-Day Timeline Visual Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedPatient.vitalsHistory.map((h, i) => {
                      const isNormal = h.temp !== null && h.temp < 99.0;
                      const hasFever = h.temp !== null && h.temp >= 99.0;
                      const isPending = h.temp === null;

                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border relative transition-all ${
                            isPending 
                              ? 'bg-amber-50/70 border-amber-300' 
                              : hasFever 
                                ? 'bg-rose-50/70 border-rose-300' 
                                : 'bg-emerald-50/70 border-emerald-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{h.day}</span>
                            <span className="text-[10px] text-slate-500">{h.date}</span>
                          </div>

                          <div className="mt-3 flex items-baseline justify-between">
                            <span className={`text-2xl font-black ${
                              isPending 
                                ? 'text-amber-600' 
                                : hasFever 
                                  ? 'text-rose-600' 
                                  : 'text-emerald-700'
                            }`}>
                              {h.temp !== null ? `${h.temp}°F` : '--'}
                            </span>

                            {isNormal && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                <Check className="w-3 h-3 text-emerald-600" />
                                No Fever (&lt;99°F)
                              </span>
                            )}
                            {hasFever && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Fever (≥99°F)
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                Awaiting Vitals
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-[10px] text-slate-500">
                            {isNormal 
                              ? "Clinically stable, afebrile benchmark met." 
                              : hasFever 
                                ? "Active viral symptom: threshold breached." 
                                : "Nurse recording pending today."}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DISCHARGE AUTHORIZATION CARD */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Physician & Admin Discharge Authorization</h4>
                          {selectedPatient.dischargeStatus === 'READY' && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Unlocked
                            </span>
                          )}
                        </div>
                        
                        {/* Clinical rationale note */}
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedPatient.dischargeStatus === 'DISCHARGED' ? (
                            <span className="text-slate-500">Patient has been formally discharged. Room {selectedPatient.roomNumber} is marked for sanitization and open for new admissions.</span>
                          ) : selectedPatient.dischargeStatus === 'READY' ? (
                            <span className="text-emerald-700 font-medium">✓ Patient meets all clinical recovery criteria (3 consecutive full days below 99.0°F). Authorized for immediate discharge.</span>
                          ) : (
                            <span className="text-slate-600">
                              Discharge is <strong>locked</strong>: {checkAfebrileCriteria(selectedPatient).reason}. 
                              A minimum of 3 consecutive afebrile days (&lt; 99.0°F) is mandatory by protocol.
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action Button: Frees room occupancy */}
                      <div>
                        {selectedPatient.dischargeStatus === 'DISCHARGED' ? (
                          <button
                            disabled
                            className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Discharge Completed ({selectedPatient.dischargedAt})
                          </button>
                        ) : (
                          <button
                            onClick={() => handleProcessDischarge(selectedPatient.id)}
                            disabled={selectedPatient.dischargeStatus !== 'READY'}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                              selectedPatient.dischargeStatus === 'READY'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer animate-pulse'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            {selectedPatient.dischargeStatus === 'READY' 
                              ? 'Authorize & Process Discharge (Free Bed)' 
                              : '🔒 Discharge Locked (Criteria Not Met)'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Operational Turnover Notice */}
                    {selectedPatient.dischargeStatus === 'READY' && (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>Clicking Authorize updates facility occupancy from <strong>{stats.occupiedBeds}/74</strong> to <strong>{stats.occupiedBeds - 1}/74</strong> immediately.</span>
                        <span className="font-semibold text-emerald-700">Admin Discharge Desk Notified</span>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BioShield Viral Quarantine & Clinical Care System • 74-Bed Capacity Unit</span>
          <span>Validated for Clinical Sequencing & Discharge Protocol Compliance</span>
        </div>
      </footer>

    </div>
  );
}
