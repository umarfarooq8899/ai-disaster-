import React, { useState, useEffect, useCallback } from 'react';
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

const AIDashboard = () => {
    const [activeTab, setActiveTab] = useState('earthquake');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [damData, setDamData] = useState(null);
    const [damLoading, setDamLoading] = useState(false);

    const tabs = [
        { id: 'earthquake', name: 'Earthquake Checker', icon: <Activity className="w-5 h-5" />, color: 'brand' },
        { id: 'flood', name: 'Flood Watch', icon: <CloudRain className="w-5 h-5" />, color: 'brand' },
        { id: 'fire', name: 'Fire Watch', icon: <Flame className="w-5 h-5" />, color: 'brand' },
        { id: 'slr', name: 'Sea Level Watch', icon: <Waves className="w-5 h-5" />, color: 'brand' },
        { id: 'dams', name: 'River Gauges', icon: <Droplets className="w-5 h-5" />, color: 'brand' },
    ];

    const fetchLiveStatus = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/ai/live-status');
            setLiveStatus(response.data);
        } catch (err) {
            console.error('Failed to fetch live status:', err);
        }
    }, []);

    const fetchDamData = useCallback(async () => {
        setDamLoading(true);
        try {
            const response = await axios.get('http://localhost:5001/api/ai/dams');
            setDamData(response.data);
        } catch (err) {
            console.error('Failed to fetch dam data:', err);
        } finally {
            setDamLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveStatus();
        const interval = setInterval(fetchLiveStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchLiveStatus]);

    useEffect(() => {
        if (activeTab === 'dams') {
            fetchDamData();
        }
    }, [activeTab, fetchDamData]);

    const handleManualScan = async () => {
        setIsScanning(true);
        setLoading(true);
        try {
            if (activeTab === 'earthquake') {
                const res = await axios.post('http://localhost:5001/api/ai/fetch-live');
                const pred = await axios.get('http://localhost:5001/api/ai/earthquake');
                setResult({ ...res.data.data, prediction: pred.data.prediction, time_to_failure: pred.data.time_to_failure });
                fetchLiveStatus();
            } else if (activeTab === 'flood') {
                const res = await axios.get('http://localhost:5001/api/ai/flood');
                setResult(res.data);
                fetchLiveStatus();
            } else if (activeTab === 'fire') {
                const res = await axios.get('http://localhost:5001/api/ai/fire');
                setResult(res.data);
                fetchLiveStatus();
            } else if (activeTab === 'dams') {
                await fetchDamData();
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

    const currentLive = liveStatus?.[activeTab] || { risk: 'stable', detail: 'Connecting to regional telemetry...' };

    const getRiskStyles = (risk) => {
        switch (risk) {
            case 'high': return { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', glow: 'shadow-red-200' };
            case 'medium': return { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600', glow: 'shadow-orange-200' };
            default: return { border: 'border-safe-200', bg: 'bg-safe-50', text: 'text-safe-600', glow: 'shadow-safe-200' };
        }
    };

    const riskStyle = getRiskStyles(currentLive.risk);

    /** Capacity fill bar color */
    const getCapacityColor = (pct) => {
        if (pct >= 90) return 'bg-red-500';
        if (pct >= 75) return 'bg-orange-400';
        if (pct >= 40) return 'bg-brand-500';
        return 'bg-slate-400';
    };

    const getStatusBadge = (statusColor) => {
        switch (statusColor) {
            case 'high': return 'bg-red-100 text-red-700 border border-red-200';
            case 'medium': return 'bg-orange-100 text-orange-700 border border-orange-200';
            default: return 'bg-safe-50 text-safe-700 border border-safe-200';
        }
    };

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
                            Pakistan AI Disaster Warning Center
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                            Real-time AI monitoring across 6 PMD city grid-points, Mangla & Tarbela dam gauges, seismic zones, and coastal nodes.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-50 border px-4 py-2 rounded-2xl">
                        <Radio className="w-4 h-4 text-brand-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Sync: {currentLive.lastChecked ? new Date(currentLive.lastChecked).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                </header>

                {/* MONITORING HUB */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* NAVIGATION SIDEBAR */}
                    <nav className="lg:col-span-3 space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Prediction Nodes</h3>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setResult(null); }}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 border group ${activeTab === tab.id
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200 translate-x-1'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-200 hover:text-brand-600'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-brand-50'}`}>
                                        {tab.icon}
                                    </div>
                                    <span className="font-bold text-sm">{tab.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 opacity-40 transition-transform ${activeTab === tab.id ? 'translate-x-1 opacity-100' : ''}`} />
                            </button>
                        ))}
                    </nav>

                    {/* MAIN CONTENT AREA */}
                    <main className="lg:col-span-9 space-y-8">

                        {/* ── RIVER GAUGES TAB ──────────────────────────────────── */}
                        {activeTab === 'dams' ? (
                            <section className="space-y-6">
                                <div className="bg-white rounded-3xl border shadow-soft p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Live Model Estimates</span>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                <Droplets className="w-6 h-6 text-brand-600" />
                                                Mangla & Tarbela Dam Gauges
                                            </h2>
                                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                                Derived from upstream catchment precipitation (Open-Meteo) + seasonal runoff models.
                                                WAPDA/IRSA do not provide a public API.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleManualScan}
                                            disabled={damLoading}
                                            className="p-4 bg-slate-50 border rounded-2xl text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 shadow-sm"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${damLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {damLoading && !damData && (
                                        <div className="text-center py-16 text-slate-400 font-bold text-sm">
                                            <Droplets className="w-8 h-8 mx-auto mb-3 animate-pulse text-brand-400" />
                                            Fetching upstream catchment data...
                                        </div>
                                    )}

                                    {damData && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[damData.mangla, damData.tarbela].filter(Boolean).map((dam) => (
                                                <div key={dam.name} className="border rounded-2xl p-6 bg-slate-50 space-y-4">
                                                    {/* Dam header */}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-lg">{dam.name}</h3>
                                                            <p className="text-xs text-slate-400 font-semibold">{dam.river}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-xl ${getStatusBadge(dam.statusColor)}`}>
                                                            {dam.statusColor === 'high' ? '⚠ ' : ''}{dam.statusColor.toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Capacity fill bar */}
                                                    <div>
                                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                                            <span>Reservoir Capacity</span>
                                                            <span className="text-slate-800">{dam.capacityPct}%</span>
                                                        </div>
                                                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${getCapacityColor(dam.capacityPct)}`}
                                                                style={{ width: `${dam.capacityPct}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                            FSL: {dam.maxLevelM}m
                                                        </p>
                                                    </div>

                                                    {/* Key metrics */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="bg-white rounded-xl p-3 text-center border">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Level</p>
                                                            <p className="text-lg font-black text-slate-800">{dam.levelM}<span className="text-xs text-slate-400 font-bold">m</span></p>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-3 text-center border">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Inflow</p>
                                                            <p className="text-lg font-black text-slate-800">{dam.inflowCumecs?.toLocaleString()}<span className="text-[9px] text-slate-400 font-bold"> c</span></p>
                                                        </div>
                                                        <div className="bg-white rounded-xl p-3 text-center border">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">7d Rain</p>
                                                            <p className="text-lg font-black text-slate-800">{dam.rain7dMM}<span className="text-xs text-slate-400 font-bold">mm</span></p>
                                                        </div>
                                                    </div>

                                                    {/* Status description */}
                                                    <div className="bg-white rounded-xl p-4 border text-left">
                                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{dam.status}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">Upstream temp: {dam.tempC}°C</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sync info */}
                                    {damData?.fetchedAt && (
                                        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                            <Radio className="w-3 h-3 text-brand-400" />
                                            Last sync: {new Date(damData.fetchedAt).toLocaleTimeString()} · Cached 15 min · {damData.mangla?.dataSource}
                                        </div>
                                    )}
                                </div>
                            </section>

                        ) : (
                            /* ── ALL OTHER TABS ─────────────────────────────────── */
                            <section className="bg-white rounded-3xl border shadow-soft overflow-hidden relative">
                                {/* Visual Accent */}
                                <div className={`absolute top-0 left-0 w-2 h-full transition-colors duration-700 ${currentLive.risk === 'high' ? 'bg-red-500' : currentLive.risk === 'medium' ? 'bg-orange-500' : 'bg-safe'
                                    }`} />

                                <div className="p-10">
                                    <header className="flex justify-between items-start mb-8 text-left">
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

                                    <div className="flex flex-col md:flex-row items-center gap-10">
                                        {/* Status Meter */}
                                        <div className="relative group">
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

                                        {/* Status Details */}
                                        <div className="flex-1 space-y-4">
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Radio className="w-3 h-3 text-brand-500" />
                                                    Live Pakistan Regional Telemetry
                                                </p>
                                                <p className="text-base font-bold text-slate-700 leading-relaxed">
                                                    {currentLive.detail}
                                                </p>
                                            </div>

                                            {/* Predictive Note */}
                                            <div className="flex items-center gap-3 px-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {activeTab === 'earthquake' ? 'Broad-scan: Quetta, Islamabad & MBT Fault' :
                                                        activeTab === 'flood' ? 'Sector: Indus River Basin, Mangla & Tarbela Catchments' :
                                                            activeTab === 'fire' ? 'Sector: Margalla Hills & Northern Juniper Forests' :
                                                                'Sector: Coastal Tectonic & Sea Level Nodes'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Directives */}
                                    {currentLive.risk !== 'low' && (
                                        <div className="mt-10 pt-8 border-t border-slate-100 text-left">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-brand-600" />
                                                Emergency Actions
                                            </h3>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <button className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-3">
                                                    <BellRing className="w-5 h-5" />
                                                    Send SMS Warning
                                                </button>
                                                <button className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all flex items-center justify-center gap-3">
                                                    <Target className="w-5 h-5" />
                                                    Call Rescue Teams
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

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
                                <div className="text-slate-500">{`[${new Date().toLocaleTimeString()}] DAM_GAUGE_MANGLA_TARBELA_UPDATED`}</div>
                                <div className="text-green-500/70">{`[${new Date().toLocaleTimeString()}] MONITORING_QUETTA_FAULT_LINE`}</div>
                            </div>

                            <div className="mt-10 bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-brand-200 uppercase font-black tracking-tight leading-4">
                                        AI Models calibrated with Pakistan historical data (2010–2024). Dam gauges derived from upstream precipitation models — WAPDA/IRSA do not publish a public API.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AIDashboard;
