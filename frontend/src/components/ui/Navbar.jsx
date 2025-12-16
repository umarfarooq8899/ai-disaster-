import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
  };

  // Close dropdown on outside click
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
    <nav className="sticky top-0 z-50 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-soft">
            AI
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Disaster Relief
          </span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 relative">

          <Link className="link hidden sm:inline" to="/alerts">Alerts</Link>
          <Link className="link hidden sm:inline" to="/report">Report</Link>

          {!user ? (
            <>
              <Link className="btn-outline" to="/login">Login</Link>
              <Link className="btn-primary" to="/signup">Sign up</Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>

              {/* PROFILE ICON */}
              <button
                onClick={() => setOpen(!open)}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white font-semibold flex items-center justify-center hover:opacity-90 transition"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>

              {/* DROPDOWN */}
              {open && (
                <div className="absolute right-0 mt-3 w-48 rounded-xl bg-white shadow-lg border py-2 text-sm">
                  
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold">{user.name || "User"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <button
                    onClick={goDashboard}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Dashboard
                  </button>

                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
