import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Menu, X, Bell, LayoutDashboard, User, LogOut, FileText } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="
                  flex items-center gap-2 p-1 pr-3 rounded-full
                  bg-brand-50 border border-brand-100
                  hover:bg-brand-100 transition
                "
              >
                <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-soft">
                  {user.name?.[0]?.toUpperCase() || "U"}
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
