import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Menu, X, Bell, LayoutDashboard, User, LogOut, FileText, CheckCircle2, Trash2, BellOff, ExternalLink } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } from "../../api/users";
import { useSocket } from "../../context/SocketContext";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/fileUtils";


export default function Navbar() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { onNotification } = useSocket();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  const goDashboard = () => {
    if (!user) return navigate("/login");

    const map = {
      general: "/dashboard/user",
      volunteer: "/dashboard/volunteer",
      ngo: "/dashboard/ngo",
      rescue: "/dashboard/rescue",
      admin: "/dashboard/admin",
    };

    navigate(map[user.role] || "/dashboard/user");
    setOpen(false);
    setMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  // Fetch notifications
  const fetchMyNotifications = async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchMyNotifications();
      // Keep 60s poll as a heartbeat, but real-time is primary
      const interval = setInterval(fetchMyNotifications, 60000);
      
      // Socket listener
      const unsubscribe = onNotification((newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        toast.success("New alert: " + newNotif.message.substring(0, 30) + "...", {
          icon: '🔔',
          duration: 4000
        });
      });

      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }
  }, [user, token]);


  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(token, id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error("Failed to dismiss notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(token, id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications(token);
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <nav
      className="
        sticky top-0 z-[1000]
        bg-white/70
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/60
        border-b border-brand-100
        shadow-sm
      "
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-soft group-hover:scale-105 transition">
            AI
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Disaster Relief
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <Link className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition" to="/alerts">
            Alerts
          </Link>
          <Link className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition" to="/report">
            Report
          </Link>
          <Link className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition" to="/statistics">
            Stats
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 md:gap-4">
          {!user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link className="text-sm font-semibold text-brand-700 hover:text-brand-800" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/signup">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 md:gap-4">

              {/* NOTIFICATIONS */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DROPDOWN */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white border border-slate-100 shadow-2xl overflow-hidden z-[1001] animate-modal">
                    <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                            {unreadCount} New
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-semibold text-brand-600 hover:text-brand-800 transition"
                            title="Mark all as read"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto w-full p-2 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 rounded-xl flex items-start gap-3 w-full transition group ${n.read ? 'opacity-60' : n.type === 'panic' ? 'bg-red-50/70' : n.type === 'warning' ? 'bg-orange-50/60' : n.type === 'success' ? 'bg-green-50/60' : 'bg-brand-50/40'}`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                              n.type === 'panic' ? 'bg-red-100 text-red-600' :
                              n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                              n.type === 'success' ? 'bg-green-100 text-green-600' :
                              'bg-brand-100 text-brand-600'
                            }`}>
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${n.read ? 'text-slate-500' : 'text-slate-900 font-semibold'} break-words whitespace-pre-wrap leading-relaxed`}>
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                              {!n.read && (
                                <button
                                  onClick={(e) => handleMarkRead(n._id, e)}
                                  className="p-1 text-slate-400 hover:text-brand-600 hover:bg-white rounded-md transition"
                                  title="Mark as read"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(n._id, e)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="border-t border-slate-50 px-4 py-3 bg-slate-50/30 flex flex-col gap-2">
                        <Link
                          to="/dashboard/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-center justify-center gap-2 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition"
                        >
                          View all history
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={handleClearAll}
                          className="text-[10px] font-semibold text-red-400 hover:text-red-600 transition text-center"
                        >
                          Clear all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* USER PROFILE DROPDOWN */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="
                  flex items-center gap-2 p-1 pr-3 rounded-full
                  bg-brand-50 border border-brand-100
                  hover:bg-brand-100 transition
                "
                >
                  <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-soft overflow-hidden">
                    {user.profilePicture ? (
                      <img
                        src={getFileUrl(user.profilePicture)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-900 hidden sm:inline">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {/* DROPDOWN */}
                {open && (
                  <div
                    className="
                    absolute right-0 mt-3 w-56
                    rounded-2xl bg-white
                    border border-brand-100 shadow-xl
                    py-2 text-sm text-slate-700
                    animate-modal
                  "
                  >
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="font-bold text-slate-900">{user.name || "User"}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={goDashboard}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </button>

                      <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                    </div>

                    <div className="border-t border-slate-50 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MOBILE MENU TRIGGER */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-50 bg-white/95 backdrop-blur-xl animate-modal overflow-hidden">
          <div className="p-4 space-y-2">
            <Link
              to="/alerts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-slate-700 font-semibold"
            >
              <Bell className="w-5 h-5 text-brand-600" />
              Alerts
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 text-slate-700 font-semibold"
            >
              <FileText className="w-5 h-5 text-brand-600" />
              Report Disaster
            </Link>

            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn border border-brand-200 text-brand-700 justify-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary justify-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
