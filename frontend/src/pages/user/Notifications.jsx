import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification, 
  clearAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences
} from "../../api/users";
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  Settings, 
  BellOff, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const { onNotification } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    disasters: true,
    missions: true,
    system: true,
    roleUpdates: true
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, unread, settings

  const fetchAll = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [notifsData, prefsData] = await Promise.all([
        getNotifications(token),
        getNotificationPreferences(token)
      ]);
      setNotifications(notifsData || []);
      setPreferences(prefsData || preferences);
    } catch (err) {
      console.error("Failed to fetch notification data");
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    
    // Real-time listener
    const unsubscribe = onNotification((newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      // Show toast for new real-time notification if on this page
      toast.success("New notification received", { icon: "🔔" });
    });

    return () => unsubscribe();
  }, [token]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(token, id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error("Error updating notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("Marked all as read");
    } catch (err) {
      toast.error("Error updating notifications");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(token, id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Error deleting notification");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await clearAllNotifications(token);
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Error clearing notifications");
    }
  };

  const handleTogglePreference = async (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    try {
      const updated = await updateNotificationPreferences(token, newPrefs);
      setPreferences(updated);
      toast.success("Preferences updated");
    } catch (err) {
      toast.error("Failed to update preferences");
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "panic": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-brand-500" />;
    }
  };

  const getTypeStyles = (type, read) => {
    if (read) return "bg-white border-slate-100 opacity-75";
    switch (type) {
      case "panic": return "bg-red-50/50 border-red-100 ring-1 ring-red-200";
      case "warning": return "bg-orange-50/50 border-orange-100 ring-1 ring-orange-200";
      case "success": return "bg-green-50/50 border-green-100 ring-1 ring-green-200";
      default: return "bg-brand-50/50 border-brand-100 ring-1 ring-brand-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-600" />
            Notifications
          </h1>
          <p className="text-slate-500 mt-1">Manage your alerts and system updates</p>
        </div>
        
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.read) && (
            <button 
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition-all border border-brand-100"
            >
              Mark all read
            </button>
          )}
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100"
          >
            Clear history
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-8 w-full md:w-max">
        {[
          { id: "all", label: "All History", icon: Bell },
          { id: "unread", label: "Unread", icon: Clock },
          { id: "settings", label: "Preferences", icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-white text-brand-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "settings" ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                Notification Preferences
              </h2>
              
              <div className="space-y-4">
                {[
                  { key: "disasters", label: "Disaster Updates", desc: "Alerts when reports are verified, rejected, or resolved." },
                  { key: "missions", label: "Mission & Tasks", desc: "Updates about mission assignments and task status changes." },
                  { key: "system", label: "System Broadcasts", desc: "Important announcements and panic alerts from administrators." },
                  { key: "roleUpdates", label: "Account & Security", desc: "Notifications about your user role or account status changes." }
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 transition-all">
                    <div>
                      <h3 className="font-bold text-slate-900">{item.label}</h3>
                      <p className="text-sm text-slate-500 max-w-md">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePreference(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                        preferences[item.key] ? "bg-brand-600" : "bg-slate-300"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences[item.key] ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-brand-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-brand-900">Privacy & Speed</h4>
                  <p className="text-sm text-brand-700">Notifications are stored securely in your profile and delivered in real-time via encrypted channels. Disabling categories will stop both push and historical logging for those events.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Fetching your history...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-sm">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellOff className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No notifications found</h3>
                <p className="text-slate-500 mt-2">When something happens, we'll let you know here.</p>
                {activeTab === "unread" && (
                  <button onClick={() => setActiveTab("all")} className="mt-4 text-brand-600 font-bold hover:underline">
                    View all history
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((n, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={n._id}
                  className={`group relative flex items-start gap-4 p-5 rounded-3xl border transition-all hover:shadow-lg ${getTypeStyles(n.type, n.read)}`}
                >
                  <div className={`mt-1 p-2.5 rounded-2xl shrink-0 ${
                    n.read ? 'bg-slate-100 text-slate-400' : 
                    n.type === 'panic' ? 'bg-red-100 text-red-600' :
                    n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                    n.type === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-brand-100 text-brand-600'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-3 mb-1">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {n.type || "System Update"}
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>
                      {n.message}
                    </p>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-xl transition shadow-sm"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {!n.read && (
                    <div className="absolute right-4 bottom-4">
                       <ChevronRight className="w-4 h-4 text-brand-300" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
