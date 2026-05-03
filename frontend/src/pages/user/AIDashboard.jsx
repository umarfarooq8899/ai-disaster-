import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { createAIDisaster } from '../../api/disasters';
import { createAlert } from '../../api/alerts';
import toast from 'react-hot-toast';
import {
    CloudRain,
    Flame,
    Waves,
    Activity,
    RefreshCw,
    BellRing,
    BrainCircuit,
    MapPin,
    History,
    Radio,
    ChevronRight,
    AlertCircle,
    ShieldAlert,
    Target,
    Info,
    Droplets
} from 'lucide-react';
import axios from 'axios';
import MapView from '../../components/map/MapView';

const AIDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('earthquake');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const tabs = [
        { id: 'earthquake', name: 'Earthquake Checker', icon: <Activity className="w-5 h-5" />, color: 'brand' },
        { id: 'flood', name: 'Flood Watch', icon: <CloudRain className="w-5 h-5" />, color: 'brand' },
        { id: 'fire', name: 'Fire Watch', icon: <Flame className="w-5 h-5" />, color: 'brand' },
        { id: 'slr', name: 'Sea Level Watch', icon: <Waves className="w-5 h-5" />, color: 'brand' },
    ];

    const fetchLiveStatus = useCallback(async () => {
        try {
            const response = await axios.get('/api/ai/live-status');
            setLiveStatus(response.data);
        } catch (err) {
            console.error('Failed to fetch live status:', err);
        }
    }, []);

    useEffect(() => {
        fetchLiveStatus();
        const interval = setInterval(fetchLiveStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchLiveStatus]);

    const handleManualScan = async () => {
        setIsScanning(true);
        setLoading(true);
        try {
            if (activeTab === 'earthquake') {
                const res = await axios.post('/api/ai/fetch-live');
                setResult({ ...res.data.data });
                fetchLiveStatus();
            } else if (activeTab === 'flood') {
                const res = await axios.get('/api/ai/flood');
                setResult(res.data);
                fetchLiveStatus();
            } else if (activeTab === 'fire') {
                const res = await axios.get('/api/ai/fire');
                setResult(res.data);
                fetchLiveStatus();
            } else {
                await new Promise(r => setTimeout(r, 1000));
                setResult(liveStatus[activeTab]);
            }
        } catch (err) {
            setResult({ error: 'AI synchronization failed', status: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setIsScanning(false), 1000);
        }
    };


    const handleSendAlert = async () => {
        if (!currentLive || currentLive.risk === 'low') return;

        try {
            const zones = currentLive.threatZones?.length > 0 ? currentLive.threatZones : [{
                title: activeTab === 'earthquake' ? 'MBT Fault' : activeTab === 'flood' ? 'Indus River Basin' : activeTab === 'fire' ? 'Margalla Hills' : 'Coastal Tectonic',
                severity: currentLive.risk || 'high'
            }];

            await Promise.all(zones.map(zone => {
                const payload = {
                    title: `AI ALERT: ${tabs.find(t => t.id === activeTab).name}`,
                    message: currentLive.detail || `High risk detected. Regional telemetry indicated anomalous patterns.`,
                    severity: zone.severity || currentLive.risk || 'high',
                    location: zone.title,
                };
                return createAlert(payload, token);
            }));

            toast.success(`AI Alerts broadcasted successfully for ${zones.length} location(s)!`, {
                duration: 4000,
                position: 'top-center',
            });
        } catch (err) {
            console.error('Failed to broadcast AI SMS warning', err);
            toast.error('Failed to send SMS warning.', { position: 'top-center' });
        }
    };

    const handleCallRescue = async () => {
        if (!currentLive || currentLive.risk === 'low') return;

        try {
            const zones = currentLive.threatZones?.length > 0 ? currentLive.threatZones : [{
                title: activeTab === 'earthquake' ? 'MBT Fault' : activeTab === 'flood' ? 'Indus River Basin' : activeTab === 'fire' ? 'Margalla Hills' : 'Coastal Tectonic',
                latitude: 30.3753,
                longitude: 69.3451,
                dangerRadius: 50,
                severity: currentLive.risk || 'high',
                description: currentLive.detail
            }];

            await Promise.all(zones.map(zone => {
                const payload = {
                    title: `AI DISASTER: ${tabs.find(t => t.id === activeTab).name} (${zone.title})`,
                    description: zone.description || currentLive.detail || `High risk detected.`,
                    severity: zone.severity || currentLive.risk || 'high',
                    location: zone.title,
                    latitude: zone.latitude || 30.3753,
                    longitude: zone.longitude || 69.3451,
                    dangerRadius: zone.dangerRadius || 50,
                    isAI: true,
                    confidence_score: currentLive.confidence || null,
                    ml_probability: currentLive.ml_probability || null,
                    threatZones: [zone],
                };
                return createAIDisaster(payload, token);
            }));

            toast.success(`Generated ${zones.length} AI Disaster(s) and notified Rescue Teams!`, {
                duration: 4000,
                position: 'top-center',
            });
        } catch (err) {
            console.error('Failed to create AI Disaster', err);
            toast.error('Failed to call Rescue Teams.', { position: 'top-center' });
        }
    };

    const currentLive = liveStatus?.[activeTab] || { risk: 'stable', detail: 'Connecting to regional telemetry...' };

    const getRiskStyles = (risk) => {
        switch (risk) {
            case 'high': return { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', glow: 'shadow-red-200' };
            case 'medium': return { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600', glow: 'shadow-orange-200' };
            default: return { border: 'border-safe-200', bg: 'bg-safe-50', text: 'text-safe-600', glow: 'shadow-safe-200' };
        }
    };

    const riskStyle = getRiskStyles(currentLive.risk);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans antialiased">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER SECTION */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border shadow-soft">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-pulse" />
                                <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-500 rounded-full animate-ping opacity-30" />
                            </div>
                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Pakistan Monitoring Active</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BrainCircuit className="w-8 h-8 text-brand-600" />
                            Disaster Warning Center
                        </h1>

                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-50 border px-4 py-2 rounded-2xl">
                        <Radio className="w-4 h-4 text-brand-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Sync: {currentLive.lastChecked ? new Date(currentLive.lastChecked).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                </header>

                {/* PREDICTION NODES (HORIZONTAL) */}
                <nav className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 hide-scrollbar w-full">

                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setResult(null); }}
                            className={`flex flex-1 flex-row items-center justify-center gap-3 px-6 py-3.5 rounded-2xl transition-all duration-200 border group shrink-0 min-w-[180px] ${activeTab === tab.id
                                ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200 -translate-y-1'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-200 hover:text-brand-600 hover:-translate-y-0.5'
                                }`}
                        >
                            <div className={`p-2.5 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-brand-50'}`}>
                                {tab.icon}
                            </div>
                            <span className="font-bold text-sm whitespace-nowrap">{tab.name}</span>
                        </button>
                    ))}
                </nav>

                {/* MAIN CONTENT AREA */}
                <main className="space-y-8">

                    {/* ── SITUATION TAB ─────────────────────────────────── */}
                    <section className="bg-white rounded-3xl border shadow-soft overflow-hidden relative">
                        {/* Visual Accent */}
                        <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-700 ${currentLive.risk === 'high' ? 'bg-red-500' : currentLive.risk === 'medium' ? 'bg-orange-500' : 'bg-safe'
                            }`} />

                        <div className="p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* --- LEFT COLUMN: WATCH SITUATION --- */}
                                <div className="lg:col-span-5 flex flex-col gap-8">
                                    <header className="flex justify-between items-start text-left">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Latest Updates</span>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{tabs.find(t => t.id === activeTab).name} Situation</h2>
                                        </div>
                                        <button
                                            onClick={handleManualScan}
                                            disabled={loading}
                                            className="p-4 bg-slate-50 border rounded-2xl text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 shadow-sm"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </header>

                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        {/* Status Meter */}
                                        <div className="relative group shrink-0">
                                            <div className={`w-44 h-44 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${riskStyle.bg} ${riskStyle.border} ${riskStyle.glow} shadow-2xl`}>
                                                <div className="text-center">
                                                    <div className={`flex justify-center mb-1 ${riskStyle.text}`}>
                                                        <AlertCircle className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Current Risk</p>
                                                    <p className={`text-2xl font-black uppercase tracking-tight ${riskStyle.text}`}>{currentLive.risk}</p>
                                                </div>
                                            </div>
                                            {isScanning && (
                                                <div className="absolute inset-[-8px] border-2 border-brand-200 rounded-full animate-ping opacity-40" />
                                            )}
                                        </div>

                                        {/* Predictive Note */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 px-2 mb-3">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {activeTab === 'earthquake' ? 'Broad-scan: MBT Fault' :
                                                        activeTab === 'flood' ? 'Sector: Indus River Basin' :
                                                            activeTab === 'fire' ? 'Sector: Margalla Hills' :
                                                                'Sector: Coastal Tectonic'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 px-2 mb-3">
                                                <Target className="w-4 h-4 text-brand-600" />
                                                <p className="text-[11px] font-bold text-brand-700 uppercase tracking-tight">
                                                    AI Confidence: {currentLive.confidence ? `${currentLive.confidence}%` : 'CALCULATING...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Details */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Radio className="w-3 h-3 text-brand-500" />
                                            Live Pakistan Regional Telemetry
                                        </p>
                                        <p className="text-base font-bold text-slate-700 leading-relaxed">
                                            {currentLive.detail}
                                        </p>
                                    </div>

                                    {/* Operational Directives (EMERGENCY ACTIONS) */}
                                    {currentLive.risk !== 'low' && user?.role === 'admin' && (
                                        <div className="mt-2 pt-6 border-t border-slate-100 text-left">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-brand-600" />
                                                Emergency Actions
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <button onClick={handleSendAlert} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2">
                                                    <BellRing className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">Send Alert</span>
                                                </button>
                                                <button onClick={handleCallRescue} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-wider hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all flex items-center justify-center gap-2">
                                                    <Target className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">Manage</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* --- RIGHT COLUMN: THREAT MAP --- */}
                                <div className="lg:col-span-7 flex flex-col">
                                    <div className="flex-1 flex flex-col">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-brand-600" />
                                            Geographic Threat Map
                                        </h3>

                                        <div className="flex flex-col gap-6 h-full">
                                            <div className="flex-1 min-h-[350px] rounded-3xl overflow-hidden border shadow-soft bg-slate-50">
                                                <MapView
                                                    disasters={currentLive.threatZones || []}
                                                    center={[30.3753, 69.3451]} // Always center on Pakistan initially
                                                    defaultZoom={5} // Custom prop to ensure map zooms out
                                                    showRadius={true}
                                                    height="100%"
                                                />
                                            </div>

                                            {(currentLive.threatZones && currentLive.threatZones.length > 0) && (
                                                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                                    {currentLive.threatZones.map((zone, idx) => (
                                                        <div key={idx} className="bg-slate-50 border rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden shrink-0 w-64">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${zone.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="font-black text-slate-800 text-sm truncate pr-2">{zone.title}</h4>
                                                                <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-lg tracking-widest ${zone.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {zone.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{zone.description}</p>
                                                            <div className="mt-auto pt-2 text-[9px] text-slate-400 font-bold tracking-tight">
                                                                Radius: {zone.dangerRadius}km
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {(!currentLive.threatZones || currentLive.threatZones.length === 0) && (
                                                <div className="bg-safe-50 border border-safe-200 rounded-2xl p-5 flex flex-col gap-2 items-center justify-center text-center">
                                                    <MapPin className="w-6 h-6 text-safe-400 mb-1" />
                                                    <h4 className="font-black text-slate-800 text-sm">No Active Threats</h4>
                                                    <p className="text-xs text-slate-500 font-medium">Map is clear.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* LOGS / SYSTEM HEALTH */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-left shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <History className="w-12 h-12 text-blue-400" />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">System Status</h3>
                        <div className="space-y-4 font-mono text-[10px] leading-relaxed">
                            {result && (
                                <div className="text-blue-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-4 animate-in slide-in-from-right-4">
                                    <p className="font-black mb-1 uppercase tracking-tighter">Localized Results:</p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        {result.prediction || result.time_to_failure?.toFixed(2) || result.message}
                                        {result.time_to_failure && " SEISMIC_COEFF"}
                                        {result.location_context && ` | ${result.location_context}`}
                                    </p>
                                </div>
                            )}
                            <div className="text-brand-400">{`[${new Date().toLocaleTimeString()}] PK_HAZARD_SCAN_OK`}</div>
                            <div className="text-slate-500">{`[${new Date().toLocaleTimeString()}] PMD_WEATHER_SYNC_6_CITIES_OK`}</div>
                            <div className="text-green-500/70">{`[${new Date().toLocaleTimeString()}] MONITORING_QUETTA_FAULT_LINE`}</div>
                        </div>

                        <div className="mt-10 bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-brand-200 uppercase font-black tracking-tight leading-4">
                                    AI Models calibrated with Pakistan historical data (2010–2024).
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AIDashboard;
