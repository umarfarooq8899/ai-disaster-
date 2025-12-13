import React, { useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Navbar from "../components/ui/Navbar";
import { AuthContext } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-blue-white">
      <div className="flex">
        <Sidebar role={user?.role || "general"} collapsed={collapsed} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />

          <div className="mx-auto w-full max-w-6xl px-5 py-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Signed in as <span className="font-semibold">{user?.name || "User"}</span>
              </div>
              <button
                className="btn-outline"
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </button>
            </div>

            <div className="card p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
