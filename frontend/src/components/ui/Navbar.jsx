import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-100 bg-white/88 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-soft">
            AI
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Disaster Relief
          </span>
        </Link>

        <div className="flex items-center p-5 gap-4">
          <Link className="link hidden sm:inline" to="/alerts">Alerts</Link>
          <Link className="link hidden sm:inline" to="/report">Report</Link>

          {!user ? (
            <>
              <Link className="btn-outline" to="/login">Login</Link>
              <Link className="btn-primary" to="/signup">Sign up</Link>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={goDashboard}>Dashboard</button>
              <button
                className="btn-primary"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
